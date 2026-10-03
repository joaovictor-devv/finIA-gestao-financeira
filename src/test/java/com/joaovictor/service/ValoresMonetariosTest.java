package com.joaovictor.service;
import java.math.BigDecimal;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.assertj.core.api.Assertions.*;
class ValoresMonetariosTest {
    @ParameterizedTest @ValueSource(strings={"0", "0.01", "123.4500", "9999999999.99"})
    void aceitaPrecisaoMonetaria(String value) {
        assertThatCode(() -> ValoresMonetarios.validar(new BigDecimal(value))).doesNotThrowAnyException();
    }
    @ParameterizedTest @ValueSource(strings={"0.001", "10000000000", "1E100", "-10000000000"})
    void rejeitaArredondamentoEOverflow(String value) {
        assertThatThrownBy(() -> ValoresMonetarios.validar(new BigDecimal(value))).isInstanceOf(IllegalArgumentException.class);
    }
}
