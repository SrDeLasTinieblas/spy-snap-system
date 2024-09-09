'use client';

import { useEffect, useState } from "react";
import Image from "next/image";

const BASE_URL = 'http://192.168.18.8:5000';

export default function Home() {
  const [pcs, setPcs] = useState([]);
  const [newPcName, setNewPcName] = useState("");
  const [capturaUrls, setCapturaUrls] = useState({});
  const [pcInfo, setPcInfo] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState(null);
  const [intervalIds, setIntervalIds] = useState({});

  useEffect(() => {
    pcs.forEach((pc) => {
      if (pc.active && !intervalIds[pc.name]) {
        const intervalId = setInterval(() => fetchPcData(pc.name), 1500);
        setIntervalIds((prevIds) => ({ ...prevIds, [pc.name]: intervalId }));
      }
    });

    return () => {
      // Limpiar todos los intervalos cuando el componente se desmonte
      Object.values(intervalIds).forEach(clearInterval);
    };
  }, [pcs, intervalIds]);

  const fetchPcData = async (pcName) => {
    try {
      const timestamp = new Date().getTime();
      const capturaUrl = `${BASE_URL}/cloud_storage/${pcName}/captura.png?timestamp=${timestamp}`;
            
      setCapturaUrls((prevUrls) => ({
        ...prevUrls,
        [pcName]: capturaUrl,
      }));
  
      const infoResponse = await fetch(`${BASE_URL}/cloud_storage/${pcName}/info_pc.json`);
      
      if (infoResponse.status === 404) {
        setPcInfo((prevInfo) => ({
          ...prevInfo,
          [pcName]: { error: 'PC no encontrada' },
        }));
        return;
      }
  
      const infoData = await infoResponse.json();
      setPcInfo((prevInfo) => ({
        ...prevInfo,
        [pcName]: infoData,
      }));
    } catch (error) {
      console.error(`Error fetching data for ${pcName}:`, error);
      setPcInfo((prevInfo) => ({
        ...prevInfo,
        [pcName]: { error: 'Error al obtener la información' },
      }));
    }
  };

  const addPc = () => {
    if (newPcName && !pcs.some(pc => pc.name === newPcName)) {
      const newPc = { name: newPcName, active: true };
      setPcs((prevPcs) => [...prevPcs, newPc]);
      setNewPcName("");
    }
  };

  const openModal = (pcName) => {
    setSelectedPc(pcName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPc(null);
  };

  const togglePc = (pcName, action) => {
    if (action === 'stop') {
      // Detener el intervalo y eliminarlo del estado
      clearInterval(intervalIds[pcName]);
      setIntervalIds((prevIds) => {
        const { [pcName]: _, ...rest } = prevIds;
        return rest;
      });
      setPcs((prevPcs) => prevPcs.map(pc => pc.name === pcName ? { ...pc, active: false } : pc));
    } else if (action === 'start') {
      // Reiniciar el intervalo solo si no está activo
      if (!intervalIds[pcName]) {
        const intervalId = setInterval(() => fetchPcData(pcName), 3000);
        setIntervalIds((prevIds) => ({ ...prevIds, [pcName]: intervalId }));
        setPcs((prevPcs) => prevPcs.map(pc => pc.name === pcName ? { ...pc, active: true } : pc));
      }
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] gap-8 min-h-screen p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold">Monitoreo de PCs</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {pcs.map((pc) => (
            <div key={pc.name} className="border p-4 rounded-md shadow-md w-full">
              <h2 className="text-xl font-semibold">{pc.name}</h2>
              <div className="mt-2">
                {pcInfo[pc.name] && pcInfo[pc.name].error ? (
                  <p className="text-red-500">{pcInfo[pc.name].error}</p>
                ) : (
                  pcInfo[pc.name] && (
                    <div className="mb-4">
                      <p>Modelo: {pcInfo[pc.name].Nombre_SO}</p>
                      <p>Estado: {pcInfo[pc.name].Estado || 'Activo'}</p>
                    </div>
                  )
                )}
              </div>
              <div className="w-full">
                {pcInfo[pc.name] && !pcInfo[pc.name].error ? (
                  capturaUrls[pc.name] ? (
                    <div className="relative aspect-video w-full h-[300px]">
                      <Image
                        src={capturaUrls[pc.name]}
                        // src='http://localhost:5000/cloud_storage/Tinieblas/captura.png'
                        // src='https://img.freepik.com/foto-gratis/puesta-sol-siluetas-arboles-montanas-ia-generativa_169016-29371.jpg?t=st=1725779613~exp=1725783213~hmac=2cfe5fdc10572010918e9d2530bb016eb6225e06e9b1be126acab557bb46d01d&w=1380'
                        alt={`Captura de ${pc.name}`}
                        // layout="fill"
                        objectFit="cover"
                        className="rounded-md"            
                        width={1000} // Ajusta el tamaño según lo necesites
                        height={500} // Ajusta el tamaño según lo necesites
                      />
                    </div>
                  ) : (
                    <p>No hay capturas disponibles para esta PC.</p>
                  )
                ) : null}
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => openModal(pc.name)}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md"
                >
                  Ver Información
                </button>
                <button
                  onClick={() => togglePc(pc.name, pc.active ? 'stop' : 'start')}
                  className={`py-2 px-4 rounded-md ${pc.active ? 'bg-red-500' : 'bg-green-500'} text-white`}
                >
                  {pc.active ? 'Detener Proceso' : 'Continuar Proceso'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 items-center">
          <input
            type="text"
            value={newPcName}
            onChange={(e) => setNewPcName(e.target.value)}
            placeholder="Nombre de la nueva PC"
            className="border p-2 rounded-md"
          />
          <button
            onClick={addPc}
            className="bg-green-500 text-white py-2 px-4 rounded-md"
          >
            Agregar PC
          </button>
        </div>
      </main>

      {modalOpen && selectedPc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-lg">
            <h2 className="text-2xl font-semibold mb-4">Información de {selectedPc}</h2>
            {pcInfo[selectedPc] ? (
              <div>
                {pcInfo[selectedPc].error ? (
                  <p className="text-red-500">{pcInfo[selectedPc].error}</p>
                ) : (
                  <>
                    <p><strong>Nombre del equipo:</strong> {pcInfo[selectedPc].Nombre_Equipo}</p>
                    <p><strong>Arquitectura:</strong> {pcInfo[selectedPc].Arquitectura.join(', ')}</p>
                    <p><strong>Dirección IP:</strong> {pcInfo[selectedPc].Direccion_IP}</p>
                    <p><strong>Procesador:</strong> {pcInfo[selectedPc].Procesador}</p>
                    <p><strong>Memoria Usada:</strong> {pcInfo[selectedPc].MemoriaUsada} GB</p>
                    <p><strong>Memoria Libre:</strong> {pcInfo[selectedPc].MemoriaLibre} GB</p>
                    <p><strong>Memoria Total:</strong> {pcInfo[selectedPc].MemoriaTotal} GB</p>
                    <p><strong>Sistema Operativo:</strong> {pcInfo[selectedPc].Sistema_Operativo}</p>
                    <p><strong>Versión del SO:</strong> {pcInfo[selectedPc].Version_SO}</p>
                    <p><strong>Estado del equipo:</strong> {pcInfo[selectedPc].Estado}</p>
                  </>
                )}
              </div>
            ) : (
              <p>Cargando información...</p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white py-2 px-4 rounded-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
