import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit:number;
  constructor(
    @InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>,
    private readonly configService:ConfigService
  ) {
    this.defaultLimit = this.configService.getOrThrow('defaultLimit')
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (e) {
      this.handleEceptions(e);
    }
  }

  findAll(paginationDto:PaginationDto) {

    const {limit = this.defaultLimit, offset=0} = paginationDto;
    
    
    return this.pokemonModel.find().limit(limit).skip(offset).sort({no:1}).select('-__v');
  }

  async findOne(id: string) {
    let pokemon: Pokemon;
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id });
    }
    if (!pokemon && isValidObjectId(id)) {
      pokemon = await this.pokemonModel.findById(id);
    }
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: id.toLowerCase().trim(),
      });
    }

    if (!pokemon)
      throw new NotFoundException('No se ha encontrado este Pokemon');
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(id);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });
    } catch (error) {
      this.handleEceptions(error);
    }

    return { ...pokemon.toJSON(), ...updatePokemonDto };
  }

  async remove(id: string) {

    const result = await this.pokemonModel.deleteOne({_id: id});
    if( result.deletedCount ===0){
      throw new BadRequestException(`El pokemon con id: ${id}, no existe`)
    }
    return { message: `Pokemon eliminado correctamente`, result};
  }

  private handleEceptions ( error:any){
    if (error.code === 11000) {
      throw new BadRequestException(
        `El Pokemon ya existe en la base de datos ${JSON.stringify(error.errmsg)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      'Error en el servidor, Revisar Logs',
    );
  }
}
