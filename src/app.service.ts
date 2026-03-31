import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getBuild() {
    return {
      version: process.env.BUILD_VERSION,
      type: process.env.BUILD_TPYE,
    };
  }
}
