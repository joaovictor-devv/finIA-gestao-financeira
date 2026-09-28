package com.joaovictor.service;

import java.math.BigDecimal;

/** Validates inputs before JDBC can round or overflow DECIMAL(12,2). */
public final class ValoresMonetarios {
    private static final BigDecimal MAXIMO = new BigDecimal("9999999999.99");
    private ValoresMonetarios() { }

    public static void validar(BigDecimal valor) {
        if (valor != null && (valor.abs().compareTo(MAXIMO) > 0
                || valor.stripTrailingZeros().scale() > 2)) {
            throw new IllegalArgumentException(
                    "Informe valores de até 9.999.999.999,99 com no máximo duas casas decimais.");
        }
    }
}
