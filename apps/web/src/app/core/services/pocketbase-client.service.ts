import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { resolvePocketBaseUrl } from '../utils/desktop-runtime-config';

@Injectable({ providedIn: 'root' })
export class PocketBaseClientService {
  readonly pb = new PocketBase(resolvePocketBaseUrl());
}
