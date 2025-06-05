import asyncio
import os
from bleak import BleakScanner, BleakClient
from datetime import datetime
import requests
import uuid

# Constantes
TARGET_NAME = "ESP32_SENSORS"
SENSORS_FILE = "/home/admin/greensync-rpi/GreenSyncData/sensorsMac"
CENTRAL_ID_FILE = "/home/admin/greensync-rpi/GreenSyncData/nodoCentral"
SUPABASE_FILE = "/home/admin/greensync-rpi/GreenSyncData/supabaseConfig"

# UUIDs características
TEMP_UUID = "12345678-1234-1234-1234-123456789001"
HUM_UUID = "12345678-1234-1234-1234-123456789002"
LUX_UUID = "12345678-1234-1234-1234-123456789003"
SOIL_UUID = "12345678-1234-1234-1234-123456789004"

def load_supabase_config():
    with open(SUPABASE_FILE, "r") as f:
        lines = f.read().splitlines()
    return lines[0], lines[1]

def load_known_macs():
    if not os.path.exists(SENSORS_FILE):
        os.makedirs(os.path.dirname(SENSORS_FILE), exist_ok=True)
        with open(SENSORS_FILE, "w") as f:
            pass
        os.chmod(SENSORS_FILE, 0o664)
        return {}
    with open(SENSORS_FILE, "r") as f:
        return dict(line.strip().split() for line in f if line.strip())

def add_mac(mac, uuid):
    with open(SENSORS_FILE, "a") as f:
        f.write(f"{mac} {uuid}\n")

def get_central_id():
    with open(CENTRAL_ID_FILE, "r") as f:
        return f.read().strip()

def insert_sensor_node(mac):
    url, key = load_supabase_config()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = {
        "id_nodo_sensor":str(uuid.uuid4()),
        "id_nodo_central": get_central_id(),
        "estado": True,
        "asociado": False,
        "mac": mac
    }

    response = requests.post(f"{url}/rest/v1/nodosensor", json=data, headers=headers)
    response.raise_for_status()
    result = response.json()
    return result[0]["id_nodo_sensor"]

def insert_measurement(sensor_id, temp, hum, lux, soil):
    url, key = load_supabase_config()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = {
        "id_nodo_sensor": sensor_id,
        "fecha": datetime.utcnow().isoformat(),
        "humedad": hum,
        "temperatura": temp,
        "luz": lux,
        "humedad_suelo": soil
    }

    print("---- Enviando datos a Supabase ----")
    print(data)

    response = requests.post(f"{url}/rest/v1/medicion", json=data, headers=headers)

    if not response.ok:
        print("Error en la respuesta de Supabase:", response.status_code)
        print("Cuerpo de la respuesta:", response.text)
        response.raise_for_status()

    print("Medición registrada correctamente:", response.json())

async def process_device(device, known_macs):
    mac = device.address

    try:
        async with BleakClient(mac, timeout=15.0) as client:
            if not client.is_connected:
                print(f" No se pudo conectar a {mac}")
                return

            print(f" Conectado a {mac}")

            temp = (await client.read_gatt_char(TEMP_UUID)).decode().strip()
            hum  = (await client.read_gatt_char(HUM_UUID)).decode().strip()
            lux  = (await client.read_gatt_char(LUX_UUID)).decode().strip()
            soil = (await client.read_gatt_char(SOIL_UUID)).decode().strip()

            print(f" Temp: {temp} | Hum: {hum} | Luz: {lux} | Suelo: {soil}")

            if mac not in known_macs:
                print(f"MAC nueva detectada: {mac} → registrando en Supabase...")
                try:
                    new_id = insert_sensor_node(mac)
                    add_mac(mac, new_id)
                    known_macs[mac] = new_id
                    print(f"Nodo registrado con ID {new_id}")
                except Exception as e:
                    print(f"Error registrando nodo sensor: {e}")
            else:
                sensor_id = known_macs[mac]
                try:   
                    valor_seco = 3950 
                    valor_mojado = 1600

                    soil_raw = float(soil)

                    if valor_seco != valor_mojado:
                        soil_pct = max(0, min(100, (valor_seco - soil_raw) * 100 / (valor_seco - valor_mojado)))
                    else:
                        soil_pct = 0
                    insert_measurement(sensor_id, float(temp), float(hum), float(lux), soil_pct)
                    print(f"Medición registrada para {mac} ({sensor_id})")
                except Exception as e:
                    print(f"Error insertando medición: {e}")

    except asyncio.TimeoutError:
        print(f"Timeout al conectar con {mac}")
    except asyncio.CancelledError:
        print(f"Conexión cancelada con {mac}")
    except Exception as e:
        print(f"Error inesperado con {mac}: {e}")

async def run_loop():
    known_macs = load_known_macs()
    while True:
        print("Escaneando dispositivos...")
        devices = await BleakScanner.discover()
        for d in devices:
            if d.name == TARGET_NAME:
                try:
                    await process_device(d, known_macs)
                except Exception as e:
                    import traceback
                    print(f"Error procesando {d.address}: {type(e).__name__}: {e}")
                    traceback.print_exc()
        print("Esperando 15 segundos antes del próximo escaneo...\n")
        await asyncio.sleep(15)

if __name__ == "__main__":
    asyncio.run(run_loop())
