import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as crypto from 'crypto';
import { env } from 'process';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) 
              private readonly userRepository: Repository<User>) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const check = await this.verify(createUserDto.name, createUserDto.email)

      if(check)
        return check
      const newUser = await this.userRepository.save(createUserDto)
      const token = this.encryptId(newUser.id)
      return this.userRepository.update(newUser.id,{token: token}).then(() => { 
        return {"token": token}
      })
    } catch (e) {
      return {error: e.message}
    }
  }

  public encryptId(id: number): any {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(process.env.SECRET_KEY).digest();
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
      throw new HttpException('Unable to encrypt id', HttpStatus.BAD_REQUEST)
    }
  }

  async findAll() {
    try {
      return this.userRepository.find();
    } catch (e) {
      return {error: e.message}
    }
  }

  async findOne(id: number) {
    try {
      return this.userRepository.findOne({where : {id: id}});
    } catch (e) {
      return {error: e.message}
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, autor: string) {
    try {
      const user = await this.userRepository.findOne({where: {id: id, token: autor}})
      if(!user)
        throw new Error(`User with id ${id} not found`)

      const check = await this.verify(updateUserDto.name)
      if(check)
        return check

      return this.userRepository.update(id, updateUserDto).then(() => {
        return { message: 'User updated successfully' }
      })
    } catch (e) {
      return {error: e.message}
    }
  }

  async remove(id: number, autor: string) {
    try {
      const user = await this.userRepository.findOne({where: {id: id, token: autor}})
      if(!user)
        throw new Error(`User with id ${id} not found`)

      return this.userRepository.delete(id).then(() => {
        return { message: 'User deleted successfully' }
      })
    } catch (e) {
      return {error: e.message}
    }
  }

  async verify(name: string, email?: string) {
    try {
      const existingUsers = await this.userRepository.find()

      existingUsers.forEach(user => {
        if (user.name === name) {
          throw new Error('User already registered', )
        }
      })

      existingUsers.forEach(user => {
        if (user.email === email) {
          throw new Error('Email already registered')
        }
      })
    } catch (e) {
      return {error: e.message}
    }
  }
}
