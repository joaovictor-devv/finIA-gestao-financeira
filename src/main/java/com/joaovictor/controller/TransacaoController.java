package com.joaovictor.controller;

import com.joaovictor.dto.ApiResponse;
import com.joaovictor.dto.SaldoResponse;
import com.joaovictor.dto.TransacaoRequest;
import com.joaovictor.model.Transacao;
import com.joaovictor.service.TransacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transacoes")
public class TransacaoController {

    private final TransacaoService service = new TransacaoService();

    @PostMapping("/entrada")
    public ResponseEntity<ApiResponse> registrarEntrada(@RequestBody TransacaoRequest request) {
        service.registrarEntrada(
                request.getValor(),
                request.getDescricao(),
                request.getCategoria(),
                request.getData() != null ? request.getData() : LocalDate.now()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(true, "Entrada registrada com sucesso."));
    }

    @PostMapping("/saida")
    public ResponseEntity<ApiResponse> registrarSaida(@RequestBody TransacaoRequest request) {
        service.registrarSaida(
                request.getValor(),
                request.getDescricao(),
                request.getCategoria(),
                request.getData() != null ? request.getData() : LocalDate.now()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(true, "Saída registrada com sucesso."));
    }

    @GetMapping("/saldo")
    public ResponseEntity<SaldoResponse> saldo() {
        return ResponseEntity.ok(new SaldoResponse(service.buscarSaldoAtual()));
    }

    @GetMapping("/extrato")
    public ResponseEntity<List<Transacao>> extrato() {
        return ResponseEntity.ok(service.listarExtrato(20));
    }
}