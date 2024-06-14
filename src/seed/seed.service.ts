import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {
  private readonly axios:AxiosInstance = axios;

  constructor(@InjectModel(Pokemon.name) private readonly pokemonModel:Model<Pokemon>, private readonly http:AxiosAdapter){

  }

  async executeSeed() {
    await this.pokemonModel.deleteMany({});
    let data = await this.http.get<PokeResponse>("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0");

    const insertPromisesArray = [];
    data.results.forEach(({name,url})=>{

      const segments = url.split('/')
      const no:number = +segments[segments.length-2];
      insertPromisesArray.push(
        this.pokemonModel.create({name, no})
      )
    })

    await Promise.all(insertPromisesArray);

    return 'Seed Executed';
  }

}
