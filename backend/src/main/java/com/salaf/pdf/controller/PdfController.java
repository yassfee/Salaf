package com.salaf.pdf.controller;

import com.salaf.auth.entity.User;
import com.salaf.pdf.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lends")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;

    // GET /api/lends/{id}/receipt — FR-22, FR-23
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        byte[] pdf = pdfService.generateLendReceipt(id, user);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"lend-" + id + "-receipt.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
