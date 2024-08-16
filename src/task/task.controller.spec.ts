import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [TaskService],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [TaskService],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  describe('create', () => {
    it('should create a new task', () => {
      const createTaskDto: CreateTaskDto = { title: 'Task title', description: 'Task description', status: 'done' };
      const autor = 'John Doe';

      jest.spyOn(service, 'create').mockImplementation(() => Promise.resolve(undefined));

      expect(controller.create(createTaskDto, autor)).resolves.toEqual("Successfully created task");
      expect(service.create).toHaveBeenCalledWith(createTaskDto, autor);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', () => {
      const tasks = [];

      jest.spyOn(service, 'findAll').mockImplementation(() => Promise.resolve(tasks));

      expect(controller.findAll()).resolves.toEqual(tasks);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', () => {
      const taskId = '1';
      const task = { id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1  };

      jest.spyOn(service, 'findOne').mockImplementation(() => Promise.resolve(task));

      expect(controller.findOne(taskId)).resolves.toEqual(task);
      expect(service.findOne).toHaveBeenCalledWith(+taskId);
    });
  });

  describe('update', () => {
    it('should update a task by ID', () => {
      const taskId = '1';
      const updateTaskDto: UpdateTaskDto = { title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1  };
      const updatedTask = { id: 1, title: 'Task Title', description: 'Task Description', inclusiveDate: new Date(), dueDate: new Date(), points: 5, userId: 1, updatedAt: new Date(), status: 'completed', priority: 1  };

      jest.spyOn(service, 'update').mockImplementation(() => Promise.resolve(undefined));

      expect(controller.update(taskId, updateTaskDto)).resolves.toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(+taskId, updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task by ID', () => {
      const taskId = '1';
      const autor = 'John Doe';

      jest.spyOn(service, 'remove').mockImplementation(() => Promise.resolve(undefined));

      expect(controller.remove(taskId, autor)).resolves.toEqual("Successfully removed task");
      expect(service.remove).toHaveBeenCalledWith(+taskId, autor);
    });
  });
});
