import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com' };
      const createdUser = { token: '123'};

      jest.spyOn(service, 'create').mockReturnValueOnce(Promise.resolve(createdUser));

      expect(controller.create(createUserDto)).resolves.toEqual(createdUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const users = [{name: 'John Doe', email: 'john.doe@example.com', token: '123', id: 1}];

      jest.spyOn(service, 'findAll').mockReturnValueOnce(Promise.resolve(users));

      expect(controller.findAll()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', () => {
      const id = '1';
      const user = {name: 'John Doe', email: 'john.doe@example.com', token: '123', id: 1};

      jest.spyOn(service, 'findOne').mockReturnValueOnce(Promise.resolve(user));

      expect(controller.findOne(id)).resolves.toEqual(user);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a user by ID', () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = { name: 'John Doe', token: '123' };
      const updatedUser = { message: 'User updated successfully' };
      const autor = 'John Doe';

      jest.spyOn(service, 'update').mockReturnValueOnce(Promise.resolve(updatedUser));

      expect(controller.update(id, updateUserDto, autor)).resolves.toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(+id, updateUserDto, autor);
    });
});

  describe('remove', () => {
    it('should remove a user by ID', () => {
      const id = '1';
      const autor = 'John Doe';
      const deletedUser = { message: 'User deleted successfully' };
      jest.spyOn(service, 'remove').mockReturnValueOnce(Promise.resolve(deletedUser));

      expect(controller.remove(id, autor)).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(+id, autor);
    });
  });
});
