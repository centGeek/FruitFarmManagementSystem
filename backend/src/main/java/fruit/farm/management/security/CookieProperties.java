package fruit.farm.management.security;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Konfiguracja atrybutów ciasteczek uwierzytelniających.
 * Domyślnie ustawienia lokalne (HTTP, ten sam host): secure=false, SameSite=Lax.
 * W środowisku produkcyjnym (front i backend na różnych domenach po HTTPS)
 * ustaw APP_COOKIE_SECURE=true oraz APP_COOKIE_SAME_SITE=None.
 */
@Component
@Getter
public class CookieProperties {

    @Value("${app.cookie.secure:false}")
    private boolean secure;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;
}
