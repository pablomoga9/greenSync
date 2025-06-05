from bluezero import peripheral, adapter
import os
import sys
import signal
import subprocess
import threading

sys.stdout.reconfigure(line_buffering=True)

adapters = list(adapter.Adapter.available())
if not adapters:
    print("No se encontró adaptador Bluetooth.")
    exit(1)

adapter_address = adapters[0].address

SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'
CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1'

def conectar_wifi_nmcli(ssid, password):
    try:
        print("Intentando conectar usando nmcli...")
        connect_cmd = ['sudo', 'nmcli', 'device', 'wifi', 'connect', ssid, 'password', password, 'ifname', 'wlan0']
        result = subprocess.run(connect_cmd, capture_output=True, text=True)
        print("Salida del comando nmcli:")
        print("STDOUT:", result.stdout.strip())
        print("STDERR:", result.stderr.strip())
        print("Código de salida:", result.returncode)

        if result.returncode == 0:
            print("Conectado correctamente a la red WiFi.")

            # Reiniciar el servicio después de conexión y configuración correcta
            restart_cmd = ['sudo', 'systemctl', 'restart', 'greensync-startup.service']
            restart_result = subprocess.run(restart_cmd, capture_output=True, text=True)
            print("Reinicio del servicio:")
            print("STDOUT:", restart_result.stdout.strip())
            print("STDERR:", restart_result.stderr.strip())
            print("Código de salida:", restart_result.returncode)

        else:
            print("Error al conectar con nmcli.")

    except Exception as e:
        print(f"Excepción al ejecutar nmcli: {e}")

def guardar_datos(supabase_url, anon_key, uuid):
    try:
        base_path = os.path.join(os.path.dirname(__file__), 'GreenSyncData')
        os.makedirs(base_path, exist_ok=True)

        config_path = os.path.join(base_path, 'supabaseConfig')
        with open(config_path, 'w') as f:
            f.write(f'{supabase_url}\n{anon_key}')

        uuid_path = os.path.join(base_path, 'nodoCentral')
        with open(uuid_path, 'w') as f:
            f.write(uuid)

        print("Archivos de configuración guardados.")
    except Exception as e:
        print(f"Error al guardar archivos: {e}")

def wifi_write_callback(value, options):
    print("Callback activado")
    try:
        decoded = bytes(value).decode('utf-8')
        parts = decoded.split('|')
        if len(parts) != 5:
            print("Formato de datos inválido")
            return

        ssid, password, supabase_url, anon_key, uuid = parts
        print(f"SSID: {ssid}")
        print(f"UUID: {uuid}")

        guardar_datos(supabase_url, anon_key, uuid)
        threading.Thread(target=conectar_wifi_nmcli, args=(ssid, password)).start()

    except Exception as e:
        print(f"Error en wifi_write_callback: {e}")

ble = peripheral.Peripheral(adapter_address=adapter_address, local_name='GreenSyncPi')

ble.add_service(srv_id=1, uuid=SERVICE_UUID, primary=True)

ble.add_characteristic(
    srv_id=1,
    chr_id=1,
    uuid=CHAR_UUID,
    value=[],
    notifying=False,
    flags=['write'],
    write_callback=wifi_write_callback
)

ble.publish()
print("Anuncio BLE iniciado como 'GreenSyncPi'. Esperando conexiones...")

try:
    signal.pause()
except KeyboardInterrupt:
    print("Detenido por el usuario.")
