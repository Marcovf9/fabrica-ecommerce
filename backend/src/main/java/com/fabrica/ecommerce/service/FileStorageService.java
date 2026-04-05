package com.fabrica.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Cloudinary cloudinary;

    public FileStorageService(@Value("${cloudinary.url}") String cloudinaryUrl) {
        this.cloudinary = new Cloudinary(cloudinaryUrl);
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "ritual_espacios",
                    "public_id", UUID.randomUUID().toString()
            ));
            return uploadResult.get("secure_url").toString();
        } catch (IOException ex) {
            throw new RuntimeException("Fallo crítico al subir el archivo a Cloudinary.", ex);
        }
    }
}