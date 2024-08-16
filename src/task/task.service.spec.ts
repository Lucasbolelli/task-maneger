import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Repository } from 'typeorm';
import { UpdateResult } from 'typeorm';
import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskService],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
describe('TaskService', () => {
  let service: TaskService;
  let taskRepositoryMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    service.isFibonacci = jest.fn();
    service.decryptId = jest.fn();
    process.env.SECRET_KEY = 'test_secret_key';
    taskRepositoryMock = module.get(getRepositoryToken(Task));
  });

  describe('calculateDueDate', () => {
    it('should calculate due date correctly with positive points', () => {
      const points = 5;
      const inclusiveDate = new Date('2023-01-01');
      const expectedDate = new Date('2023-01-06');

      const result = service['calculateDueDate'](points, inclusiveDate);

      expect(result).toEqual(expectedDate);
    });

    it('should return the same date with zero points', () => {
      const points = 0;
      const inclusiveDate = new Date('2023-01-01');
      const expectedDate = new Date('2023-01-01');

      const result = service['calculateDueDate'](points, inclusiveDate);

      expect(result).toEqual(expectedDate);
    });

    it('should return the same date with negative points', () => {
      const points = -5;
      const inclusiveDate = new Date('2023-01-01');
      const expectedDate = new Date('2023-01-01');

      const result = service['calculateDueDate'](points, inclusiveDate);

      expect(result).toEqual(expectedDate);
    });
  });

  describe('create', () => {
    it('should return an error if points are not in the Fibonacci sequence', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      const createTaskDto: CreateTaskDto = { points: 4, inclusiveDate: new Date(), dueDate: new Date(), userId: 30 };
      const autor = 'someEncryptedId';

      jest.spyOn(service, 'isFibonacci').mockReturnValue(false);

      const result = await service.create(createTaskDto, autor);

      expect(result).toEqual({ error: 'Points must be in the Fibonacci sequence' });
    });

    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = { points: 5, inclusiveDate: new Date(), dueDate: new Date(), userId: 30 };
      const updateTaskDto: UpdateTaskDto = { points: 5, inclusiveDate: new Date(), dueDate: new Date(), userId: 30 };
      const autor = 'someEncryptedId';
      const decryptedId = 'someDecryptedId';
      const dueDate = new Date();
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(service, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(service, 'calculateDueDate').mockReturnValue(dueDate);
      jest.spyOn(service, 'decryptId').mockReturnValue(+decryptedId);
      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      const result = await service.create(createTaskDto, autor);

      expect(service.isFibonacci).toHaveBeenCalledWith(createTaskDto.points);
      expect(service.calculateDueDate).toHaveBeenCalledWith(createTaskDto.points, createTaskDto.inclusiveDate);
      expect(service.decryptId).toHaveBeenCalledWith(autor);
      expect(taskRepository.save).toHaveBeenCalledWith(createTaskDto);
      expect(result).toEqual({ message: 'Task created successfully' });
    });

    it('should return an error if taskRepository.save throws an error', async () => {
      const createTaskDto: CreateTaskDto = { points: 5, inclusiveDate: new Date(), dueDate: new Date(), userId: 30 };
      const autor = 'someEncryptedId';
      const decryptedId = 'someDecryptedId';
      const dueDate = new Date();
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(service, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(service, 'calculateDueDate').mockReturnValue(dueDate);
      jest.spyOn(service, 'decryptId').mockReturnValue(+decryptedId);
      jest.spyOn(taskRepository, 'save').mockRejectedValue(new Error('Save failed'));

      const result = await service.create(createTaskDto, autor);

      expect(service.isFibonacci).toHaveBeenCalledWith(createTaskDto.points);
      expect(service.calculateDueDate).toHaveBeenCalledWith(createTaskDto.points, createTaskDto.inclusiveDate);
      expect(service.decryptId).toHaveBeenCalledWith(autor);
      expect(taskRepository).toHaveBeenCalledWith(createTaskDto);
      expect(result).toEqual({ error: 'Save failed' });
    });
  });
});

  describe('decryptId', () => {
    it('should decrypt the token successfully', () => {
      const token = 'ivHex:encrypted';
      const ivHex = 'ivHex';
      const encrypted = 'encrypted';
      const decryptedId = '123';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(Buffer, 'from').mockReturnValue(Buffer.from(ivHex, 'hex'));
      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.from('key')),
      } as any);
      jest.spyOn(crypto, 'createDecipheriv').mockReturnValue({
        update: jest.fn().mockReturnValue(decryptedId),
        final: jest.fn().mockReturnValue(''),
      } as any);

      const result = service.decryptId(token);

      expect(result).toBe(+decryptedId);
    });

    it('should throw an error if token format is invalid', () => {
      const token = 'invalidToken';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      expect(() => service.decryptId(token)).toThrow('Unable to decrypt id');
    });

    it('should throw an error if decryption fails', () => {
      const token = 'ivHex:encrypted';
      const ivHex = 'ivHex';
      const encrypted = 'encrypted';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(Buffer, 'from').mockReturnValue(Buffer.from(ivHex, 'hex'));
      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(Buffer.from('key')),
      } as any);
      jest.spyOn(crypto, 'createDecipheriv').mockReturnValue({
        update: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
        final: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
      } as any);

      expect(() => service.decryptId(token)).toThrow('Unable to decrypt id');
    });
});

describe('findAll', () => {
  it('should return an array of tasks', async () => {
    let service: TaskService;
    let taskRepository: Repository<Task>;
    const tasks = [{}];
    jest.spyOn(taskRepository, 'find').mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual(tasks);
    expect(taskRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should throw an HttpException if an error occurs', async () => {
    let service: TaskService;
    let taskRepository: Repository<Task>;
    jest.spyOn(taskRepository, 'find').mockRejectedValue(new Error('Test Error'));

    await expect(service.findAll()).rejects.toThrow(
      new HttpException('Unable finding tasks', HttpStatus.BAD_REQUEST),
    );
  });
});

  describe('findOne', () => {
    it('should return a task if found', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      const task: Task = { id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1 };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(task);

      const result = await service.findOne(1);

      expect(result).toEqual(task);
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(taskRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw an HttpException if an error occurs', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      jest.spyOn(taskRepository, 'findOne').mockRejectedValue(new Error('Test Error'));

      await expect(service.findOne(1)).rejects.toThrow(
        new HttpException('Unable to find task with id 1', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('isFibonacci', () => {
    it('should return true for a number in the Fibonacci sequence', () => {
      let service: TaskService;
      expect(service.isFibonacci(1)).toBe(true);
      expect(service.isFibonacci(2)).toBe(true);
      expect(service.isFibonacci(3)).toBe(true);
      expect(service.isFibonacci(5)).toBe(true);
      expect(service.isFibonacci(8)).toBe(true);
    });

    it('should return false for a number not in the Fibonacci sequence', () => {
      let service: TaskService;
      expect(service.isFibonacci(4)).toBe(false);
      expect(service.isFibonacci(6)).toBe(false);
      expect(service.isFibonacci(7)).toBe(false);
      expect(service.isFibonacci(9)).toBe(false);
    });

    it('should return false for non-positive numbers', () => {
      let service: TaskService;
      expect(service.isFibonacci(0)).toBe(false);
      expect(service.isFibonacci(-1)).toBe(false);
      expect(service.isFibonacci(-5)).toBe(false);
    });

    it('should handle large numbers correctly', () => {
      let service: TaskService;
      expect(service.isFibonacci(144)).toBe(true);
      expect(service.isFibonacci(233)).toBe(true); 
      expect(service.isFibonacci(987)).toBe(true); 
      expect(service.isFibonacci(1000)).toBe(false);
    });
  });

  describe('update', () => {
    it('should update the task successfully when points are in the Fibonacci sequence', async () => {
      const findTask = { id: 1, inclusiveDate: new Date() };
      const updateTaskDto: UpdateTaskDto = { points: 5 };
      const updatedTask = { ...updateTaskDto, dueDate: new Date(), updatedAt: new Date() };
      let service: TaskService;
      let taskRepository: Repository<Task>;

      (taskRepository.findOne as jest.Mock).mockResolvedValue(findTask);
      jest.spyOn(service, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(service, 'calculateDueDate').mockReturnValue(new Date());
      (taskRepository.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(1, updateTaskDto);

      expect(result).toEqual({ message: 'Task updated successfully' });
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(service.isFibonacci).toHaveBeenCalledWith(5);
      expect(service.calculateDueDate).toHaveBeenCalledWith(5, findTask.inclusiveDate);
      expect(taskRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        points: 5,
        dueDate: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
    });

    it('should return an error when the task is not found', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      const result = await service.update(1, { points: 5 });

      expect(result).toEqual({ error: 'Task with id 1 not found' });
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return an error when points are not in the Fibonacci sequence', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      const task: Task = { id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1 };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(task);
      jest.spyOn(service, 'isFibonacci').mockReturnValue(false);
    
      const result = await service.update(1, { points: 4 });
    
      expect(result).toEqual({ error: 'Points must be in the Fibonacci sequence' });
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(service.isFibonacci).toHaveBeenCalledWith(4);
    });

    it('should update the task successfully when points are not provided', async () => {
      let service: TaskService;
      let taskRepository: Repository<Task>;
      const task: Task = { id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1 };
      const updateTaskDto: UpdateTaskDto = {};


      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(task);
      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 1 } as UpdateResult);

      const result = await service.update(1, updateTaskDto);

      expect(result).toEqual({ message: 'Task updated successfully' });
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(taskRepository.update).toHaveBeenCalledWith(1, updateTaskDto);
    });
  });

  describe('remove', () => {
      it('should delete a task successfully', async () => {
      const id = 1;
      const autor = 'encryptedUserId';
      const decryptedUserId = 'decryptedUserId';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(service, 'decryptId').mockReturnValue(+decryptedUserId);
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue({ id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1 });
      jest.spyOn(taskRepository, 'delete').mockResolvedValue(undefined);

      const result = await service.remove(id, autor);

      expect(service.decryptId).toHaveBeenCalledWith(autor);
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id, userId: decryptedUserId } });
      expect(taskRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Task deleted successfully' });
    });

    it('should return an error if task is not found', async () => {
      const id = 1;
      const autor = 'encryptedUserId';
      const decryptedUserId = 'decryptedUserId';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(service, 'decryptId').mockReturnValue(+decryptedUserId);
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      const result = await service.remove(id, autor);

      expect(service.decryptId).toHaveBeenCalledWith(autor);
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id, userId: decryptedUserId } });
      expect(result).toEqual({ error: `Task with id ${id} not found` });
    });

    it('should return an error if an exception occurs', async () => {
      const id = 1;
      const autor = 'encryptedUserId';
      const errorMessage = 'Some error';
      let service: TaskService;
      let taskRepository: Repository<Task>;

      jest.spyOn(service, 'decryptId').mockImplementation(() => { throw new Error(errorMessage); });

      const result = await service.remove(id, autor);

      expect(service.decryptId).toHaveBeenCalledWith(autor);
      expect(result).toEqual({ error: errorMessage });
    });
  });
