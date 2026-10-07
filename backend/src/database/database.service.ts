import { Injectable } from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class DatabaseService {
    readonly db = db;
}