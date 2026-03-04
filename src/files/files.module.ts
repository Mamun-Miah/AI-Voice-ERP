import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express'; // [cite: 169]
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import * as fs from 'fs';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB global limit
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          //upload businessLogo
          if (file.fieldname === 'businessLogo') {
            const path = `./uploads/user/business`;
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, { recursive: true });
            }
            return cb(null, path);
            //upload businessTradeLicense
          } else if (file.fieldname === 'businessTradeLicense') {
            const path = `./uploads/user/documents`;
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, { recursive: true });
            }
            return cb(null, path);
            //upload invoiceFiles and profof delivery files
          } else if (
            file.fieldname === 'invoiceFiles' ||
            file.fieldname === 'profOfDeliveryFiles'
          ) {
            const path = `./uploads/user/files`;
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, { recursive: true });
            }
            return cb(null, path);
            //upload nidImage and profileImage
          } else {
            // Dynamic folder selection
            const subFolder =
              file.fieldname === 'nidImage' ? 'documents' : 'profiles';
            const path = `./uploads/user/${subFolder}`;

            // Ensure directories exist
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, { recursive: true });
            }
            cb(null, path);
          }
        },
        filename: (req, file, cb) => {
          // Secure filename with unique suffix to avoid collisions
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
