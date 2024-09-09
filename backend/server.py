from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'cloud_storage'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

CORS(app)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def guardar_archivos(equipo, imagen, json_data):
    carpeta_equipo = os.path.join(app.config['UPLOAD_FOLDER'], equipo)
    if not os.path.exists(carpeta_equipo):
        os.makedirs(carpeta_equipo)

    imagen_path = os.path.join(carpeta_equipo, imagen.filename)
    imagen.save(imagen_path)

    json_path = os.path.join(carpeta_equipo, 'info_pc.json')
    with open(json_path, 'w') as json_file:
        json_file.write(json_data)

    return {'mensaje': 'Archivos subidos exitosamente'}

@app.route('/subir_archivos', methods=['POST'])
def subir_archivos():
    if 'imagen' not in request.files or 'json' not in request.form:
        return jsonify({'error': 'Faltan parámetros'}), 400

    imagen = request.files['imagen']
    json_data = request.form['json']
    nombre_equipo = request.form.get('nombre_equipo')

    if not nombre_equipo or not imagen:
        return jsonify({'error': 'Nombre del equipo o imagen no proporcionados'}), 400

    resultado = guardar_archivos(nombre_equipo, imagen, json_data)
    return jsonify(resultado)

@app.route('/cloud_storage/<usuario>/captura.png', methods=['GET'])
def obtener_captura(usuario):
    """Devuelve la imagen captura.png para el usuario solicitado"""
    carpeta_usuario = os.path.join(app.config['UPLOAD_FOLDER'], usuario)
    
    if not os.path.exists(carpeta_usuario):
        return abort(404, description="Usuario no encontrado")

    captura_path = os.path.join(carpeta_usuario, 'captura.png')
    if not os.path.exists(captura_path):
        return abort(404, description="Imagen no encontrada")
    
    return send_file(captura_path, mimetype='image/png')

@app.route('/cloud_storage/<usuario>/info_pc.json', methods=['GET'])
def obtener_info_pc(usuario):
    """Devuelve el archivo JSON info_pc.json para el usuario solicitado"""
    carpeta_usuario = os.path.join(app.config['UPLOAD_FOLDER'], usuario)
    
    if not os.path.exists(carpeta_usuario):
        return abort(404, description="Usuario no encontrado")
    
    json_path = os.path.join(carpeta_usuario, 'info_pc.json')
    if not os.path.exists(json_path):
        return abort(404, description="Archivo JSON no encontrado")
    
    return send_file(json_path, mimetype='application/json')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
