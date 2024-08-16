import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com' };
      const createdUser = { token: '123' };

      jest.spyOn(service, 'create').mockResolvedValue(createdUser);

      await expect(controller.create(createUserDto)).resolves.toEqual(createdUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ name: 'John Doe', email: 'john.doe@example.com', token: '123', id: 1 }];

      jest.spyOn(service, 'findAll').mockResolvedValue(users);

      await expect(controller.findAll()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const id = '1';
      const user = { name: 'John Doe', email: 'john.doe@example.com', token: '123', id: 1 };

      jest.spyOn(service, 'findOne').mockResolvedValue(user);

      await expect(controller.findOne(id)).resolves.toEqual(user);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = { name: 'John Doe', token: '123' };
      const updatedUser = { message: 'User updated successfully' };
      const autor = 'John Doe';

      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      await expect(controller.update(id, updateUserDto, autor)).resolves.toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(+id, updateUserDto, autor);
    });
  });

  describe('remove', () => {
    it('should remove a user by ID', async () => {
      const id = '1';
      const autor = 'John Doe';
      const deletedUser = { message: 'User deleted successfully' };

      jest.spyOn(service, 'remove').mockResolvedValue(deletedUser);

      await expect(controller.remove(id, autor)).resolves.toEqual(deletedUser);
      expect(service.remove).toHaveBeenCalledWith(+id, autor);
    });
  });
});