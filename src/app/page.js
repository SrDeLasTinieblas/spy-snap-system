'use client';

import { useEffect, useState } from "react";
import Image from "next/image";

const BASE_URL = 'https://092c-38-253-146-9.ngrok-free.app';

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
      const intervalId = setInterval(() => fetchPcData(pc.name), 3000);
      setIntervalIds(prevIds => ({ ...prevIds, [pc.name]: intervalId }));
      return () => clearInterval(intervalId);
    });

    return () => {
      Object.values(intervalIds).forEach(clearInterval);
    };
  }, [pcs]);

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
      clearInterval(intervalIds[pcName]);
      setPcs((prevPcs) => prevPcs.map(pc => pc.name === pcName ? { ...pc, active: false } : pc));
    } else if (action === 'start') {
      const intervalId = setInterval(() => fetchPcData(pcName), 3000);
      setIntervalIds(prevIds => ({ ...prevIds, [pcName]: intervalId }));
      setPcs((prevPcs) => prevPcs.map(pc => pc.name === pcName ? { ...pc, active: true } : pc));
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
                        alt={`Captura de ${pc.name}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
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
                    <p><strong>Tiempo de Arranque:</strong> {pcInfo[selectedPc].TiempoDeArranque}</p>
                    <p><strong>Uso de CPU:</strong> {pcInfo[selectedPc].UsoDeCPU}%</p>
                    <p><strong>Frecuencia de CPU:</strong> {pcInfo[selectedPc].Frecuencia_CPU} MHz</p>
                    <p><strong>Disco:</strong> {pcInfo[selectedPc].Discos[0].Dispositivo} - {pcInfo[selectedPc].Discos[0].PorcentajeDeUso}% de uso, {pcInfo[selectedPc].Discos[0].EspacioLibre} GB libres de {pcInfo[selectedPc].Discos[0].TamañoTotal} GB</p>
                  </>
                )}
              </div>
            ) : (
              <p>Cargando información...</p>
            )}
            <button
              onClick={closeModal}
              className="bg-red-500 text-white py-2 px-4 rounded-md mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
