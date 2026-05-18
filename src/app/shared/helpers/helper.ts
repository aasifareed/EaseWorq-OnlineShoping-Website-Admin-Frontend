export const commonHelperMethods = {
    getFileType(file) {

         
        if(file.type.match('video.*'))
          return 'video';
      
        if(file.type.match('audio.*'))
          return 'audio';
    
          if(file.type.match('doc.*'))
          return 'doc';

          if(file.type.match('pdf.*'))
          return 'pdf';

          if(file.type.match('xls.*'))
          return 'xls';
          
          if(file.type.match('csv.*'))
          return 'csv';

          if(file.type.match('gif.*'))
          return 'gif';

          if(file.type.match('txt.*'))
          return 'txt';

          if(file.type.match('docx.*'))
          return 'docx';

          if(file.type.match('png.*'))
          return 'png';

          if(file.type.match('jpeg.*'))
          return 'jpeg';

          if(file.type.match('jpg.*'))
          return 'jpg';
          

          if(file.type.match('image.*'))
          return 'image';
          
          
          
          
        // etc...
    
        return 'other';
      }
  };