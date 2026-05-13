package com.joaovictor.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexao {

    private static final String URL =
            "jdbc:mysql://localhost:3306/banco_app" +
                    "?useSSL=false" +
                    "&serverTimezone=UTC" +
                    "&allowPublicKeyRetrieval=true";

    private static final String USER = "root";
    private static final String PASSWORD = "root";

    private Conexao() {
    }

    public static Connection abrir() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}