import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    let mockUserRepository: Repository<User>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;
    service = new UserService(userRepository);
    service.verify = jest.fn();
    service.encryptId = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const newUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        token: 'encryptedId',
      };

      jest.spyOn(service, 'verify').mockResolvedValue(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(service, 'encryptId').mockReturnValue('encryptedId');

      const result = await service.create(createUserDto);

      expect(service.verify).toHaveBeenCalledWith(createUserDto.name, createUserDto.email);
      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
      expect(service.encryptId).toHaveBeenCalledWith(newUser.id);
      expect(userRepository.update).toHaveBeenCalledWith(newUser.id, { token: 'encryptedId' });
      expect(result).toEqual({ token: 'encryptedId' });
    });

    it('should return an error if user already exists', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      jest.spyOn(service, 'verify').mockResolvedValue({ error: 'User already registered' });

      const result = await service.create(createUserDto);

      expect(service.verify).toHaveBeenCalledWith(createUserDto.name, createUserDto.email);
      expect(result).toEqual({ error: 'User already registered' });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com', token: 'encryptedId' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', token: 'encryptedId' },
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });
  
    it('should return a user by id', async () => {
      const user = new User();
      user.id = 1;
      user.name = 'John Doe';
      user.email = 'john.doe@example.com';
      user.token = 'encryptedId';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);

      const result = await service.findOne(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should return an error if an exception is thrown', async () => {
      const errorMessage = 'User not found';
      jest.spyOn(userRepository, 'findOne').mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.findOne(1)).rejects.toThrow(errorMessage);
    });
  });

  describe('update', () => {
    it('should return an error if user is not found', async () => {
      const errorMessage = 'User not found';
      const user = new User();
      user.id = 1;
      user.token = 'token';

      const userRepository: Partial<Repository<User>> = {
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        update: jest.fn().mockRejectedValueOnce(new Error(errorMessage))
      };


      jest.spyOn(userRepository, 'find').mockRejectedValueOnce(new Error(errorMessage));

      await expect(userRepository.update(1, { name: 'New Name' })).rejects.toThrow(errorMessage);
    });

    it('should return check result if verify fails', async () => {
      const user = new User();
      const errorMessage = 'Verification failed';
      user.id = 1;
      user.token = 'token';

      const userRepository: Partial<Repository<User>> = {
        findOne: jest.fn(),
        remove: jest.fn(),
        update: jest.fn().mockRejectedValueOnce(new Error(errorMessage))

      };

      jest.spyOn(userRepository, 'findOne').mockRejectedValueOnce(new Error(errorMessage));

      await expect(userRepository.update(1, { name: 'New Name' })).rejects.toThrow(errorMessage);
    });

    it('should return success message if update is successful', async () => {
      const id = 1;
      const autor = 'validToken';

      const userRepository: Repository<User> = {
        findOne: jest.fn(),
        remove: jest.fn(),
        update: jest.fn()
      } as unknown as Repository<User>;

      const service: UserService = new UserService(userRepository);

      const mockUser: User = {
        id,
        token: autor,
        name: 'Test User',
        email: 'test@example.com'
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(service, 'verify').mockResolvedValueOnce(null);
      jest.spyOn(userRepository, 'update').mockResolvedValueOnce({ token: 'encryptedId' } as any);

      const result = await service.update(1, { name: 'New Name' } as UpdateUserDto, 'token');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1, token: 'token' } });
      expect(service.verify).toHaveBeenCalledWith('New Name');
      expect(userRepository.update).toHaveBeenCalledWith(1, { name: 'New Name' });
      expect(result).toEqual({ message: 'User updated successfully' });
    });

    it('should return an error if an exception is thrown', async () => {
      const errorMessage = 'Some error';
      const autor = 'validToken';

      const userRepository: Repository<User> = {
        findOne: jest.fn(),
        remove: jest.fn()
      } as unknown as Repository<User>;

      jest.spyOn(userRepository, 'findOne').mockRejectedValueOnce(new Error(errorMessage));
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      const id = 1;
      const autor = 'validToken';

      const userRepository: Repository<User> = {
        findOne: jest.fn(),
        remove: jest.fn()
      } as unknown as Repository<User>;

      const service: UserService = new UserService(userRepository);

      const mockUser: User = {
        id,
        token: autor,
        name: 'Test User',
        email: 'test@example.com'
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'remove').mockResolvedValue({} as User);

      const result = await service.remove(id, autor);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: id, token: autor } });
      expect({ message: 'User deleted successfully' }).toEqual({ message: 'User deleted successfully' });
    });

    it('should return an error if user is not found', async () => {
      const id = 1;
      const autor = 'invalidToken';
      const mockUser: User = {
        id,
        token: autor,
        name: 'Test User',
        email: 'test@example.com'
      };

      const userRepository: Repository<User> = {
        findOne: jest.fn(),
        remove: jest.fn()
      } as unknown as Repository<User>;

      const service: UserService = new UserService(userRepository);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
    
      const result = await service.remove(id, autor);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id, token: autor } });
      expect(result).toEqual({ error: `User with id ${id} not found` });
    });

    it('should return an error if deletion fails', async () => {
      let userRepository: Repository<User>;
      const service: UserService = new UserService(userRepository);
      const id = 1;
      const autor = 'validToken';
      const mockUser: User = {
        id,
        token: autor,
        name: 'Test User',
        email: 'test@example.com'
      };
  
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(service, 'remove').mockRejectedValue(new Error('Deletion failed'));
  
      await expect(service.remove(id, autor)).rejects.toThrow('Deletion failed');
    });
  });

  describe('verify', () => {
    it('should return an error if the user is already registered', async () => {
      let userRepository: Repository<User>;
      const service: UserService = new UserService(userRepository);
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john@example.com', token: 'token' };

      jest.spyOn(service, 'verify').mockResolvedValue({ error: 'User already registered' });

      const result = await service.verify(createUserDto.name, createUserDto.email);

      expect(service.verify).toHaveBeenCalledWith(createUserDto.name, createUserDto.email);
      expect(result).toEqual({ error: 'User already registered' });
    });
  });
