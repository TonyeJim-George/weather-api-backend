import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptProvider extends HashingProvider {

  async hash(data: string, salt: number): Promise<string> {
    const generatedSalt = await bcrypt.genSalt(salt);
    return bcrypt.hash(data, generatedSalt);
  }


  async compare(data: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(data, hashed);
  }
}