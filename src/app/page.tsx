'use client'

import Image from "next/image";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import api from './services/api';

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ddd: number;
}
  
 


export default function Home() {

  const [input, setInput] = useState('');

  const [cep, setCep] = useState<CepData | null>(null);

  async function handleSearch(){
    if(input === ''){
      alert('Preencha algum cep')

      return;
    }
    try{
      const response = await api.get(`${input}/json`); //chama valor do input
     setCep(response.data);
     console.log(response.data);
     setInput("");

    } catch{
      
      alert("Erro ao buscar");
      setInput("")
    }
  }

  return (
    <div className="flex h-screen justify-center items-center 
    flex-col bg-gradient-to-r from-gray-900 to-gray-800">
     <div>
      <h1 className="text-white xl:text-6xl md:text-8xl sm:text-6xl animate-flipTitle  " >Buscador CEP</h1>
     </div>

     <div className="mt-4 flex m-8 rounded-md  p-4 
      bg-gray-600 shadow-lg">
      <input type="text" placeholder="Digite seu Cep.."
       className=".placeholder-white::placeholder 
       outline-none bg-transparent mr-2 border-none text-white " 
       value={input}
       onChange={(e) => setInput(e.target.value)}
       />

      <button type="button" className="flex bg-transparent
      cursor-pointer justify-center items-center brder-none hover:.scale-150
      " onClick={handleSearch}>
        <FiSearch size={25} color="white" className=""/>
      </button>
     </div>

     {cep && Object.keys(cep).length > 0 && (
  <main className="text-white bg-gray-500 flex flex-col content-center 
  items-center w-[500px] rounded-md">
    <h2 className="text-3xl mb-2 mt-2">CEP: {cep.cep} </h2>

    <span className="mb-4">Número: {cep.complemento}</span>
    <span className="mb-4">Bairro: {cep.bairro}</span>
    <span className="mb-4">Estado: {cep.uf}</span>
    <span className="mb-4">Cidade: {cep.localidade}</span>
  </main>
)}

    </div>
  );
}
