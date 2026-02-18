import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
    abstract hash(data: string, salt: number): Promise<string>;
    abstract compare(data: string, hashed: string): Promise<boolean>;
}
