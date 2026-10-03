package com.joaovictor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** HTTP controllers + real services and JDBC repositories; no paid AI requests. */
@SpringBootTest(properties = "openai.api-key=")
@AutoConfigureMockMvc
class JornadaApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    static final String DB = "jdbc:h2:mem:finia_jornada;MODE=MySQL;DB_CLOSE_DELAY=-1";
    static String oldUrl, oldUser, oldPassword;

    @BeforeAll static void banco() throws Exception {
        oldUrl = System.getProperty("DB_URL");
        oldUser = System.getProperty("DB_USER");
        oldPassword = System.getProperty("DB_PASSWORD");
        System.setProperty("DB_URL", DB);
        System.setProperty("DB_USER", "sa");
        System.setProperty("DB_PASSWORD", "test");
        try (var con = DriverManager.getConnection(DB, "sa", "test"); var st = con.createStatement()) {
            String schema = Files.readString(Path.of("database/schema.sql"));
            for (String sql : schema.split(";")) {
                if (sql.trim().startsWith("CREATE TABLE")) st.execute(sql);
            }
        }
    }
    @AfterAll static void restaurar() {
        restore("DB_URL", oldUrl); restore("DB_USER", oldUser); restore("DB_PASSWORD", oldPassword);
    }
    static void restore(String key, String value) {
        if (value == null) System.clearProperty(key); else System.setProperty(key, value);
    }
    @BeforeEach void limpar() throws Exception {
        try (var con = DriverManager.getConnection(DB, "sa", "test"); var st = con.createStatement()) {
            st.execute("DELETE FROM metas"); st.execute("DELETE FROM perfil_financeiro");
        }
    }
    JsonNode ler(String url) throws Exception {
        return json.readTree(mvc.perform(get(url)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    void preparar() throws Exception {
        mvc.perform(put("/perfil-financeiro").contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"João\",\"saldoAtual\":1500}"))
                .andExpect(status().isOk());
        mvc.perform(put("/orcamento").contentType(MediaType.APPLICATION_JSON)
                .content("{\"rendaMensal\":3000,\"gastosMensais\":1200,\"valorPlanejadoGuardar\":300}"))
                .andExpect(status().isOk());
    }
    static String meta(String nome, int alvo) {
        return "{\"nome\":\"" + nome + "\",\"valorAlvo\":" + alvo + ",\"valorInicial\":0,\"prazoMeses\":10,\"prioridade\":\"alta\"}";
    }
    long criar() throws Exception {
        return json.readTree(mvc.perform(post("/metas").contentType(MediaType.APPLICATION_JSON).content(meta("Notebook", 10000)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("meta").path("id").asLong();
    }
    @Test void jornadaCompletaPreservaDadosNasSimulacoes() throws Exception {
        preparar(); long id = criar();
        JsonNode perfilAntes = ler("/perfil-financeiro");
        JsonNode metasAntes = ler("/metas");
        // 1000/month already committed; editing this same goal must exclude that commitment.
        mvc.perform(post("/metas/" + id + "/simular").contentType(MediaType.APPLICATION_JSON).content(meta("Notebook novo", 12000)))
                .andExpect(status().isOk()).andExpect(jsonPath("viavel").value(true))
                .andExpect(jsonPath("comprometimentoOutrasMetas").value(0));
        assertThat(ler("/metas")).isEqualTo(metasAntes);
        mvc.perform(post("/simulacoes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"meses\":12,\"eventos\":[{\"mes\":2,\"tipo\":\"RENDA_EXTRAORDINARIA\",\"valor\":500}]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("evolucaoMensal.length()").value(12));
        assertThat(ler("/perfil-financeiro")).isEqualTo(perfilAntes);
        assertThat(ler("/metas")).isEqualTo(metasAntes);
        mvc.perform(put("/metas/" + id).contentType(MediaType.APPLICATION_JSON).content(meta("Notebook novo", 12000)))
                .andExpect(status().isOk()).andExpect(jsonPath("meta.nome").value("Notebook novo"));
        mvc.perform(put("/metas/" + id).contentType(MediaType.APPLICATION_JSON).content(meta("Inviável", 999999)))
                .andExpect(status().isUnprocessableEntity());
        assertThat(ler("/metas/" + id).path("nome").asText()).isEqualTo("Notebook novo");
        mvc.perform(patch("/metas/" + id + "/progresso").contentType(MediaType.APPLICATION_JSON).content("{\"valorAtual\":12000}"))
                .andExpect(status().isOk()).andExpect(jsonPath("analise.classificacao").value("CONCLUIDA"));
        assertThat(ler("/analise/capacidade-gastos").path("comprometimentoMensalMetas").asDouble()).isZero();
        mvc.perform(delete("/metas/" + id)).andExpect(status().isOk());
        assertThat(ler("/metas").size()).isZero();
    }
    @Test void rejeitaDinheiroInvalidoSemAlterarPersistencia() throws Exception {
        preparar(); long id = criar(); JsonNode antes = ler("/perfil-financeiro");
        for (String valor : new String[]{"-1", "0.001", "10000000000", "1e100"}) {
            mvc.perform(put("/perfil-financeiro/saldo").contentType(MediaType.APPLICATION_JSON).content("{\"saldoAtual\":" + valor + "}"))
                    .andExpect(status().isBadRequest());
            mvc.perform(patch("/metas/" + id + "/progresso").contentType(MediaType.APPLICATION_JSON).content("{\"valorAtual\":" + valor + "}"))
                    .andExpect(status().isBadRequest());
        }
        assertThat(ler("/perfil-financeiro")).isEqualTo(antes);
        assertThat(ler("/metas/" + id).path("valorInicial").asDouble()).isZero();
    }
    @Test void iaOpcionalESimulacaoValidada() throws Exception {
        preparar();
        mvc.perform(get("/ia/status")).andExpect(status().isOk()).andExpect(jsonPath("configurada").value(false));
        mvc.perform(post("/ia/perguntar").contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Como estou?\"}"))
                .andExpect(status().isServiceUnavailable());
        mvc.perform(post("/simulacoes").contentType(MediaType.APPLICATION_JSON).content("{\"meses\":61}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/metas").contentType(MediaType.APPLICATION_JSON).content(meta("Inviável", 999999)))
                .andExpect(status().isUnprocessableEntity());
        assertThat(ler("/metas").size()).isZero();
        mvc.perform(post("/simulacoes").contentType(MediaType.APPLICATION_JSON).content("{\"meses\":1.5}"))
                .andExpect(status().isBadRequest());
    }
}
