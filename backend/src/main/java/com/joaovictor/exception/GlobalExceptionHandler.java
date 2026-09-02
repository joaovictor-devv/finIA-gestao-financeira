package com.joaovictor.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SaldoInsuficienteException.class)
    public ResponseEntity<Map<String, Object>> tratarSaldoInsuficiente(SaldoInsuficienteException e) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("erro", "SALDO_INSUFICIENTE");
        erro.put("mensagem", e.getMessage());
        erro.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> tratarIllegalArgument(IllegalArgumentException e) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("erro", "DADOS_INVALIDOS");
        erro.put("mensagem", e.getMessage());
        erro.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> tratarRuntime(RuntimeException e) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("erro", "ERRO_INTERNO");
        erro.put("mensagem", e.getMessage());
        erro.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> tratarGenerico(Exception e) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("erro", "ERRO_NAO_ESPERADO");
        erro.put("mensagem", e.getMessage());
        erro.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
    }
}