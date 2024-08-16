import { CreateTaskDto } from './dto/create-task.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import * as crypto from 'crypto';

@Injectable()
export class TaskService {
  constructor(@InjectRepository(Task) 
              private readonly taskRepository: Repository<Task>) {}

  public calculateDueDate(points: number, inclusiveDate: Date): Date {
    try {
      const daysToAdd = points;
      const dueDate = inclusiveDate;
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      return dueDate;
    } catch (error) {
      throw new Error('Error calculating due date');
    }
  }

  async create(createTaskDto: CreateTaskDto, autor: string) {
    try {
      if (!this.isFibonacci(createTaskDto.points))
        throw Error('Points must be in the Fibonacci sequence');

      createTaskDto.inclusiveDate = new Date();
      createTaskDto.dueDate = this.calculateDueDate(createTaskDto.points, createTaskDto.inclusiveDate);
      createTaskDto.userId = this.decryptId(autor);

      return this.taskRepository.save(createTaskDto).then(() => {
        return {message: 'Task created successfully'};
      });
    } catch (e) {
      return {error: e.message}
    }
  }

  public decryptId(token: string): number {
    try {
      const [ivHex, encrypted] = token.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = crypto.createHash('sha256').update(process.env.SECRET_KEY).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return +decrypted;
    } catch (e) {
      throw new  Error('Unable to decrypt id');
    }
  }

  async findAll() {
    try {
      return this.taskRepository.find();
    } catch (e) {
      throw new HttpException('Unable finding tasks', HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: number) {
    try {
      return this.taskRepository.findOne({where : {id: id}});
    } catch (e) {
      throw new HttpException(`Unable to find task with id ${id}`, HttpStatus.BAD_REQUEST);
    }
  }

  public isFibonacci(num: number): boolean {
    try {
      if (num === 1) return true;
      if (num <= 0) return false;

      const fibSequence: number[] = [0, 1];
      Array.from({ length: (num + 2) - 2 }).forEach(() => {
          const nextFib = fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2];
          fibSequence.push(nextFib);
      });
      return fibSequence.includes(num);
    } catch (error) {
      throw new Error('Points must be in the Fibonacci sequence');
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    try {
      const findTask = await this.taskRepository.findOne({where: {id: id}})
      if(!findTask)
        throw new Error(`Task with id ${id} not found`)

      if (updateTaskDto.points !== undefined) {
        if (!this.isFibonacci(updateTaskDto.points)) {
          throw Error('Points must be in the Fibonacci sequence');
        }else {
          updateTaskDto.dueDate = this.calculateDueDate(updateTaskDto.points, findTask.inclusiveDate);
          updateTaskDto.updatedAt = new Date();
        }
      }

      return this.taskRepository.update(id, updateTaskDto).then(() => {
        return {message: 'Task updated successfully'};
      });
    } catch (e) {
      return {error: e.message}
    }
  }

  async remove(id: number, autor: string) {
    try {
      const findTask = await this.taskRepository.findOne({where: {id: id, userId: this.decryptId(autor)}})
      if(!findTask)
        throw new Error(`Task with id ${id} not found`)
      return this.taskRepository.delete(id).then(() => {
        return {message: 'Task deleted successfully'};
      });
    } catch (e) {
      return {error: e.message}
    }
  }
}
