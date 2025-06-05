#!/bin/bash

RUTA_BASE="/home/admin/greensync-rpi"
NODO_CENTRAL="$RUTA_BASE/GreenSyncData/nodoCentral"
SUPABASE_CONFIG="$RUTA_BASE/GreenSyncData/supabaseConfig"

echo "Comprobando archivos..."

if [[ -f "$NODO_CENTRAL" && -f "$SUPABASE_CONFIG" ]]; then
    echo "Archivos encontrados. Ejecutando ble_scanner.py"

    while true; do
        python3 "$RUTA_BASE/ble_scanner.py" 2>&1
        echo "Reiniciando ble_scanner.py en 10 segundos..."
        sleep 10
    done

else
    echo "Faltan archivos de configuración. Ejecutando greensync_ble.py"
    python3 "$RUTA_BASE/greensync_ble.py"
fi
