/*****************************************************************************/
/* MIDDLEWARE FOR ROUTES THAT HANDLE MULTIFORM DATA WITH FILES               */
/*****************************************************************************/

/* External module imports */
import httpStatus from 'http-status';
import {Error} from '@natlibfi/melinda-commons';
import multer, {memoryStorage} from 'multer';


/*****************************************************************************/

function checkFileType(req, file, cb) {
  if (!file.originalname.endsWith('.mrc') && !file.originalname.endsWith('.json')) {
    const error = new Error(httpStatus.BAD_REQUEST, 'Invalid data file type: should be .json or .mrc');
    cb(error);
  }

  cb(null, true);
};

const multerConfig = {
  storage: memoryStorage(),
  fileFilter: checkFileType
};

export const handleFile = multer(multerConfig).single('file');