import io
import json
import socket
import requests
import pyautogui
import time
import os
import psutil
import platform
import GPUtil
from datetime import datetime
import math

def solicitar_base_url():
    base_url = input("Por favor, ingresa la base URL de la API: ")
    return base_url

BASE_URL = solicitar_base_url()
END_POINT = '/subir_archivos'

API_URL = BASE_URL + END_POINT

def capturar_pantalla():
    screenshot = pyautogui.screenshot()
    
    imagen_buffer = io.BytesIO()
    screenshot.save(imagen_buffer, format="PNG")
    imagen_buffer.seek(0)
    return imagen_buffer

def obtener_programas_abiertos():
    programas = []
    for proceso in psutil.process_iter(['pid', 'name', 'username']):
        try:
            programas.append({
                'pid': proceso.info['pid'],
                'nombre': proceso.info['name'],
                'usuario': proceso.info['username']
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return programas

def obtener_informacion_pc():
    info_sistema = {}
    info_sistema['Sistema_Operativo'] = platform.system()
    info_sistema['Nombre_SO'] = platform.platform()
    info_sistema['Version_SO'] = platform.version()
    info_sistema['Arquitectura'] = platform.architecture()
    info_sistema['Nombre_Equipo'] = socket.gethostname()
    info_sistema['Direccion_IP'] = socket.gethostbyname(socket.gethostname())
    info_sistema['Procesador'] = platform.processor()
    info_sistema['UsoDeCPU'] = psutil.cpu_percent(interval=1)
    info_sistema['Nucleos'] = psutil.cpu_count(logical=True)
    info_sistema['Frecuencia_CPU'] = psutil.cpu_freq().current

    memoria = psutil.virtual_memory()
    info_sistema['MemoriaTotal'] = round(memoria.total / (1024**3), 2)
    info_sistema['MemoriaUsada'] = round(memoria.used / (1024**3), 2)
    info_sistema['MemoriaLibre'] = round(memoria.available / (1024**3), 2)

    particiones = psutil.disk_partitions()
    discos = []
    for particion in particiones:
        uso = psutil.disk_usage(particion.mountpoint)
        discos.append({
            'Dispositivo': particion.device,
            'PuntoMontaje': particion.mountpoint,
            'SistemaArchivos': particion.fstype,
            'TamañoTotal': round(uso.total / (1024**3), 2),
            'EspacioUsado': round(uso.used / (1024**3), 2),
            'EspacioLibre': round(uso.free / (1024**3), 2),
            'PorcentajeDeUso': uso.percent
        })
    info_sistema['Discos'] = discos

    interfaces_red = psutil.net_if_addrs()
    conexiones = []
    for interface, direcciones in interfaces_red.items():
        for direccion in direcciones:
            if str(direccion.family) == 'AddressFamily.AF_INET':
                conexiones.append({
                    'Interfaz': interface,
                    'IP': direccion.address,
                    'MáscaraDeRed': direccion.netmask,
                    'Broadcast': direccion.broadcast
                })
    info_sistema['ConexionesDeRed'] = conexiones

    try:
        gpus = GPUtil.getGPUs()
        gpu_info = []
        for gpu in gpus:
            gpu_info.append({
                'ID_GPU': gpu.id,
                'Nombre_GPU': gpu.name,
                'Memoria_Total': gpu.memoryTotal,
                'Memoria_Libre': gpu.memoryFree,
                'Memoria_Usada': gpu.memoryUsed,
                'Temperatura': gpu.temperature,
                'PorcentajeDeUso_GPU': gpu.load * 100 if not math.isnan(gpu.load) else None
                })
        info_sistema['GPU'] = gpu_info
    except:
        info_sistema['GPU'] = 'No se encontraron GPUs'

    tiempo_arranque = datetime.fromtimestamp(psutil.boot_time())
    info_sistema['TiempoDeArranque'] = tiempo_arranque.strftime("%Y-%m-%d %H:%M:%S")
    info_sistema['Programas_Abiertos'] = obtener_programas_abiertos()
    
    return info_sistema

def subir_datos_a_api(nombre_equipo, imagen, json_data):
    files = {
        'imagen': ('captura.png', imagen, 'image/png'),
    }
    data = {
        'json': json.dumps(json_data),
        'nombre_equipo': nombre_equipo
    }

    response = requests.post(API_URL, files=files, data=data)
    
    if response.status_code == 200:
        print('Archivos subidos exitosamente')
    else:
        print(f'Error al subir archivos: {response.status_code} - {response.text}')

if __name__ == '__main__':
    nombre_equipo = socket.gethostname()
    info_pc = obtener_informacion_pc()
    captura = capturar_pantalla()
    
    subir_datos_a_api(nombre_equipo, captura, info_pc)

    while True:
        captura = capturar_pantalla()
        subir_datos_a_api(nombre_equipo, captura, info_pc)
        time.sleep(2)
