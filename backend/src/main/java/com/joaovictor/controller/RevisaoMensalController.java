package com.joaovictor.controller;

import com.joaovictor.dto.ApiResponse;
import com.joaovictor.dto.RevisaoMensalRequest;
import com.joaovictor.model.RevisaoMensal;
import com.joaovictor.service.RevisaoMensalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/revisoes-mensais")
public class RevisaoMensalController {

    private final RevisaoMensalService service = new RevisaoMensalService();

    @PostMapping
    public ResponseEntity<ApiResponse> cadastrar(@RequestBody RevisaoMensalRequest request) {
        service.cadastrarRevisao(
                request.getMesReferencia(),
                request.isGastoInesperado(),
                request.isValorIncorreto(),
                request.isRevisarCategorias(),
                request.getObservacoes()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(true, "Revisão mensal cadastrada com sucesso."));
    }

    @GetMapping
    public ResponseEntity<List<RevisaoMensal>> listar() {
        return ResponseEntity.ok(service.listarRevisoes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RevisaoMensal> buscarPorId(@PathVariable long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> excluir(@PathVariable long id) {
        service.excluirRevisao(id);
        return ResponseEntity.ok(new ApiResponse(true, "Revisão mensal excluída com sucesso."));
    }
}