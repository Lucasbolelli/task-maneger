import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  const taskRepositoryMock: Repository<Task> = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  } as unknown as Repository<Task>;
  const serviceMock: TaskService = new TaskService(taskRepositoryMock);
  const task: Task | any = { 
    id: 1, 
    title: 'Test Task', 
    points: 5, 
    description: 'Test Description', 
    inclusiveDate: new Date(), 
    dueDate: new Date(), 
    updatedAt: new Date(),
    status: 'Pended',
    userId: 1,
    priority: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDueDate', () => {
    it('should calculate due date correctly with positive points', () => {
      const date = new Date('2023-01-01');
      const points = 5;
      const expectedDate = new Date('2023-01-06');
      expect(serviceMock.calculateDueDate(points, date)).toEqual(expectedDate);
    });

    it('should return the same date with zero points', () => {
      const date = new Date('2023-01-01');
      const points = 0;
      expect(serviceMock.calculateDueDate(points, date)).toEqual(date);
    });

    it('should return the same date with negative points', () => {
      const date = new Date('2023-01-01');
      const points = -5;
      expect(serviceMock.calculateDueDate(points, date)).toEqual(date);
    });
  });

  describe('create', () => {
    it('should return an error if points are not in the Fibonacci sequence', async () => {
      const taskDto = { title: 'Test Task', points: 4 };
      jest.spyOn(serviceMock, 'isFibonacci').mockReturnValue(false);
      jest.spyOn(serviceMock, 'create').mockRejectedValue(new Error('Points must be in the Fibonacci sequence'));
      await expect(serviceMock.create(taskDto, 'token')).rejects.toThrow('Points must be in the Fibonacci sequence');
    });

    it('should create a task successfully', async () => {
      const taskDto = { title: 'Test Task', points: 5 };
      jest.spyOn(serviceMock, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(taskRepositoryMock, 'save').mockResolvedValue(task);
      jest.spyOn(serviceMock, 'create').mockResolvedValue(task);
      await expect(serviceMock.create(taskDto, 'token')).resolves.toEqual(task);
    });

    it('should return an error if taskRepository.save throws an error', async () => {
      const taskDto = { title: 'Test Task', points: 5 };
      jest.spyOn(serviceMock, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(taskRepository, 'save').mockRejectedValue(new Error('Database error'));
      jest.spyOn(serviceMock, 'create').mockRejectedValue(new Error('Database error'));
      await expect(serviceMock.create(taskDto, 'token')).rejects.toThrow('Database error');
    });
  });

  describe('decryptId', () => {
    it('should decrypt the token successfully', () => {
      const token = 'encryptedToken';
      const decryptedId = 1;
      jest.spyOn(serviceMock, 'decryptId').mockReturnValue(decryptedId);
      expect(serviceMock.decryptId(token)).toEqual(decryptedId);
    });

    it('should throw an error if token format is invalid', () => {
      const token = 'invalidToken';
      jest.spyOn(serviceMock, 'decryptId').mockImplementation(() => {
        throw new Error('Unable to decrypt id');
      });
      expect(() => serviceMock.decryptId(token)).toThrow('Unable to decrypt id');
    });

    it('should throw an error if decryption fails', () => {
      const token = 'encryptedToken';
      jest.spyOn(serviceMock, 'decryptId').mockImplementation(() => {
        throw new Error('Unable to decrypt id');
      });
      expect(() => serviceMock.decryptId(token)).toThrow('Unable to decrypt id');
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      jest.spyOn(taskRepositoryMock, 'find').mockResolvedValue([task]);
      jest.spyOn(serviceMock, 'findAll').mockResolvedValue([task]);
      await expect(serviceMock.findAll()).resolves.toEqual([task]);
    });

    it('should throw an HttpException if an error occurs', async () => {
      jest.spyOn(taskRepository, 'find').mockRejectedValue(new Error('Database error'));
      jest.spyOn(serviceMock, 'findAll').mockRejectedValue(new Error('Database error'));
      await expect(serviceMock.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(task);
      jest.spyOn(serviceMock, 'findOne').mockResolvedValue(task);
      await expect(serviceMock.findOne(1)).resolves.toEqual(task);
    });

    it('should throw an HttpException if an error occurs', async () => {
      jest.spyOn(taskRepositoryMock, 'findOne').mockRejectedValue(new Error('Database error'));
      jest.spyOn(serviceMock, 'findOne').mockRejectedValue(new Error('Database error'));
      await expect(serviceMock.findOne(1)).rejects.toThrow('Database error');
    });
  });

  describe('isFibonacci', () => {
    it('should return true for a number in the Fibonacci sequence', () => {
      expect(serviceMock.isFibonacci(5)).toBe(true);
    });

    it('should handle large numbers correctly', () => {
      expect(serviceMock.isFibonacci(144)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update the task successfully when points are in the Fibonacci sequence', async () => {
      const taskDto: any = { title: 'Updated Task', points: 5 };
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(task);
      jest.spyOn(serviceMock, 'isFibonacci').mockReturnValue(true);
      jest.spyOn(taskRepositoryMock, 'save').mockResolvedValue({ ...task, ...taskDto });
      jest.spyOn(serviceMock, 'update').mockResolvedValue({ ...task, ...taskDto });
      await expect(serviceMock.update(1, taskDto)).resolves.toEqual({ ...task, ...taskDto });
    });

    it('should return an error when the task is not found', async () => {
      const taskDto = { title: 'Updated Task', points: 5 };
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(null);
      jest.spyOn(serviceMock, 'update').mockRejectedValue(new Error('Task not found'));
      await expect(serviceMock.update(1, taskDto)).rejects.toThrow('Task not found');
    });

    it('should return an error when points are not in the Fibonacci sequence', async () => {
      const taskDto = { title: 'Updated Task', points: 4 };
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(task);
      jest.spyOn(serviceMock, 'isFibonacci').mockReturnValue(false);
      jest.spyOn(serviceMock, 'update').mockRejectedValue(new Error('Points must be in the Fibonacci sequence'));
      await expect(serviceMock.update(1, taskDto)).rejects.toThrow('Points must be in the Fibonacci sequence');
    });

    it('should update the task successfully when points are not provided', async () => {
      const taskDto: any = { title: 'Updated Task' };
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(task);
      jest.spyOn(taskRepositoryMock, 'save').mockResolvedValue({ ...task, ...taskDto });
      jest.spyOn(serviceMock, 'update').mockResolvedValue({ ...task, ...taskDto });
      await expect(serviceMock.update(1, taskDto)).resolves.toEqual({ ...task, ...taskDto });
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(task);
      jest.spyOn(taskRepositoryMock, 'remove').mockResolvedValue(task);
      jest.spyOn(serviceMock, 'remove').mockResolvedValue(undefined);
      await expect(serviceMock.remove(1,'token')).resolves.toBeUndefined();
    });

    it('should return an error if task is not found', async () => {
      jest.spyOn(taskRepositoryMock, 'findOne').mockResolvedValue(null);
      jest.spyOn(serviceMock, 'remove').mockRejectedValue(new Error('Task not found'));
      await expect(serviceMock.remove(1, 'token')).rejects.toThrow('Task not found');
    });

    it('should return an error if an exception occurs', async () => {
      jest.spyOn(taskRepositoryMock, 'findOne').mockRejectedValue(new Error('Task not found'));
      jest.spyOn(serviceMock, 'remove').mockRejectedValue(new Error('Task not found'));
      await expect(serviceMock.remove(1 , 'token')).rejects.toThrow('Task not found');
    });
  });
});