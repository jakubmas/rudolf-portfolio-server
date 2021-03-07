import argon2 from 'argon2';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from 'type-graphql';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { MyContext } from '../types';
import { sendEmail } from '../utils/sendEmail';
import { customErrorMessage, validateEmail } from '../utils/validation';

@InputType()
class UsernameEmailPasswordInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(()=>UserResponse) 
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() {redis, req}: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 4) {
      return customErrorMessage('newPassword', 'Password must be greater than 4') 
    }

    const key = FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if(!userId) {
      return customErrorMessage('token', 'Token expired') 
    }

    const user = await User.findOne(userId)

    if(!user) {
      return customErrorMessage('token', 'User no longer exist') 
    }

    User.update({id: parseInt(userId)}, {password: await argon2.hash(newPassword)})

    await redis.del(key)
    // log in user after change password
    req.session.userId = user.id

    return {user}
  }

  @Mutation(()=>Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() {redis} : MyContext
  ) {
    if(!validateEmail(email)){
      return customErrorMessage('email','Email in incorrect')      
    }

    const user = await User.findOne({email})

    if(!user) {
      return true
    }

    const token = v4()
    
    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3) //3 days

    sendEmail(email, `<a href="http://localhost:3000/backoffice/change-password/${token}">Reset Password</a>`)

    return true
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    try {
      return await User.findOne({ id: req.session.userId });
    } catch (error) {
      return customErrorMessage('username','Username not found')
    }
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernameEmailPasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {

    if (options.username.length <= 2) {
      return customErrorMessage('username','Length must be greater than 2')
    }

    if(!validateEmail(options.email)) {
      return customErrorMessage('email', 'That email is incorrect') 
    }
    
    if (options.password.length <= 4) {
      return customErrorMessage('password', 'Password must be greater than 4') 
    }

    const emailExist = await User.findOne({email: options.email})
    
    if (emailExist) {
      return customErrorMessage('email', 'That email is taken') 
    }

    const hashedPassword = await argon2.hash(options.password);
    
    const user = await User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    }).save()

    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const isEmail = validateEmail(usernameOrEmail)
    const user = await User.findOne(isEmail ? { email: usernameOrEmail }:{ username: usernameOrEmail });

    if (!user) {
      return customErrorMessage('usernameOrEmail', "That user doesn't exist") 
    }

    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return customErrorMessage('password', 'incorrect password') 
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log('🔥 err 🔥', err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
