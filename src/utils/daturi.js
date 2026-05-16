import DataUriParsar from"dataur/parser.js";
import path from "path";
const parser = new DataUriParsar();
const getDataUri = (file)=>{
    const extname = path.extname(file.originalname).toString();
    return parser.format(extName.file.buffer).content

}
export default getDataUri;