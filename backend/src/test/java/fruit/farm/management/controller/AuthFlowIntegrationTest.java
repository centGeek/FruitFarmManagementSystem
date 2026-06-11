package fruit.farm.management.controller;

import fruit.farm.management.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Auth flow (register -> verify)")
class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mvc;

    private static final String REGISTER_BODY = """
            {
              "name": "New",
              "surname": "Gardener",
              "nickname": "newgardener",
              "email": "newgardener@orch.com",
              "password": "secret123",
              "confirmPassword": "secret123",
              "phoneNumber": "555-000-111",
              "localityName": "Warsaw",
              "coordinateDTO": { "latitude": 52.0, "longitude": 21.0 }
            }
            """;

    @Test
    @DisplayName("registering a gardener issues an accessToken cookie that /verify accepts")
    void register_thenVerify_succeeds() throws Exception {
        MvcResult registerResult = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REGISTER_BODY))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("accessToken"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        Cookie accessToken = registerResult.getResponse().getCookie("accessToken");
        assertThat(accessToken).isNotNull();
        assertThat(accessToken.getValue()).isNotBlank();

        mvc.perform(get("/api/auth/verify").cookie(accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.nickname").value("newgardener"));
    }

    @Test
    @DisplayName("/verify without a token reports not authenticated (401)")
    void verify_withoutToken_isUnauthorized() throws Exception {
        mvc.perform(get("/api/auth/verify"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }
}
