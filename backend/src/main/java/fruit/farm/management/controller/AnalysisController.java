package fruit.farm.management.controller;


import fruit.farm.management.service.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
@AllArgsConstructor
@Slf4j
public class AnalysisController {

    private UserService userService;
//    @GetMapping
//    public ResponseEntity<?> getProfitsPerSectors(){
//
//
//    }
}
