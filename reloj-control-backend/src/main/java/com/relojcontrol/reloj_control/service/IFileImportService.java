package com.relojcontrol.reloj_control.service;

import org.springframework.web.multipart.MultipartFile;
 
public interface IFileImportService {
    void importarDat(MultipartFile file) throws Exception;
} 