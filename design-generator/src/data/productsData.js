export const CATEGORIES = {
    AT: 'Antigo Testamento',
    NT: 'Novo Testamento',
    COMBO: 'Combos & Cursos'
};

export const LANGUAGES = ['BRASIL', 'PORTUGUÊS', 'ESPANHOL', 'INGLÊS', 'FRANCÊS', 'ALEMÃO'];

export const LANGUAGE_FLAGS = {
    BRASIL: '🇧🇷',
    'PORTUGUÊS': '🇵🇹',
    ESPANHOL: '🇪🇸',
    'INGLÊS': '🇬🇧',
    'FRANCÊS': '🇫🇷',
    'ALEMÃO': '🇩🇪'
};

export const products = [
    {
        id: 'pentateuco',
        name: 'Pentateuco',
        category: 'AT',
        icon: '📜',
        description: 'Os cinco primeiros livros da Bíblia — Gênesis a Deuteronômio.',
        languages: {
            BRASIL: {
                url: 'https://bibliaexplicativa.com/pentateucobr',
                checkoutBasic: 'https://pay.kiwify.com.br/1R8rJ6n',
                checkoutFull: 'https://pay.kiwify.com.br/8BY3czX'
            },
            'PORTUGUÊS': {
                url: 'https://bibliaexplicativa.com/pentateuco',
                checkoutBasic: 'https://pay.hotmart.com/X100148771M?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/U100148928P?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://bibliaexplicativa.com/pentateucoes',
                checkoutBasic: 'https://pay.hotmart.com/D100149043T?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/F100149098T?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://bibliaexplicativa.com/pentateuch',
                checkoutBasic: 'https://pay.hotmart.com/E100149212A?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/P100149294Q?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://bibliaexplicativa.com/Pentateuque',
                checkoutBasic: 'https://pay.hotmart.com/C101050596C?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/K101050726M?checkoutMode=10'
            },
            'ALEMÃO': {}
        }
    },
    {
        id: 'historicos',
        name: 'Históricos',
        category: 'AT',
        icon: '⚔️',
        description: 'Os livros históricos — Josué a Ester.',
        languages: {}
    },
    {
        id: 'poeticos',
        name: 'Poéticos',
        category: 'AT',
        icon: '🎵',
        description: 'Os livros poéticos e de sabedoria — Jó a Cantares.',
        languages: {}
    },
    {
        id: 'profetas-maiores',
        name: 'Profetas Maiores',
        category: 'AT',
        icon: '🔥',
        description: 'Os grandes profetas — Isaías a Daniel.',
        languages: {}
    },
    {
        id: 'profetas-menores',
        name: 'Profetas Menores',
        category: 'AT',
        icon: '📢',
        description: 'Os doze profetas menores — Oséias a Malaquias.',
        languages: {}
    },
    {
        id: 'evangelhos',
        name: 'Evangelhos',
        category: 'NT',
        icon: '✝️',
        description: 'Os quatro Evangelhos — Mateus, Marcos, Lucas e João.',
        languages: {
            BRASIL: {
                url: 'https://sabercristao.com/evangelhos',
                checkoutBasic: 'https://pay.kiwify.com.br/b7rXaVc',
                checkoutFull: 'https://pay.kiwify.com.br/XGHbDp0'
            },
            'PORTUGUÊS': {
                url: 'https://sabercristao.com/4evangelhos',
                checkoutBasic: 'https://pay.hotmart.com/S97742930F?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/H97743035I?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://sabercristao.com/evangelio',
                checkoutBasic: 'https://pay.hotmart.com/P97292015M?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/E97292140X?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://sabercristao.com/gospel',
                checkoutBasic: 'https://pay.hotmart.com/M97176773P?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/D97177203Q?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://sabercristao.com/Evangiles',
                checkoutBasic: 'https://pay.hotmart.com/T98948867B?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/N98948943S?checkoutMode=10'
            },
            'ALEMÃO': {
                url: 'https://sabercristao.com/evangeliums',
                checkoutBasic: 'https://pay.hotmart.com/G98197154M?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/L98197301C?checkoutMode=10'
            }
        }
    },
    {
        id: 'atos',
        name: 'Atos dos Apóstolos',
        category: 'NT',
        icon: '🕊️',
        description: 'A história da igreja primitiva — Atos dos Apóstolos.',
        languages: {}
    },
    {
        id: 'cartas-paulo',
        name: 'Cartas de Paulo',
        category: 'NT',
        icon: '✉️',
        description: 'As epístolas paulinas — Romanos a Filemom.',
        languages: {
            BRASIL: {
                url: 'https://sabercristao.com/cartasdepaulo',
                checkoutBasic: 'https://pay.kiwify.com.br/9u1dDlG',
                checkoutFull: 'https://pay.kiwify.com.br/FoesrKX'
            },
            'PORTUGUÊS': {
                url: 'https://sabercristao.com/cartasdepaulovpv',
                checkoutBasic: 'https://pay.hotmart.com/F97922733A?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/U97922922J?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://sabercristao.com/cartasdepablo',
                checkoutBasic: 'https://pay.hotmart.com/W98015568P?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/V98015731O?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://sabercristao.com/Paulsletters',
                checkoutBasic: 'https://pay.hotmart.com/J98041114T?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/P98041339S?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://sabercristao.com/lettresdePaul',
                checkoutBasic: 'https://pay.hotmart.com/F99057350A?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/Q99057509R?checkoutMode=10'
            },
            'ALEMÃO': {
                url: 'https://sabercristao.com/DiePaulusbriefe',
                checkoutBasic: 'https://pay.hotmart.com/X98385413L?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/W98416671D?checkoutMode=10'
            }
        }
    },
    {
        id: 'cartas-universais',
        name: 'Cartas Universais',
        category: 'NT',
        icon: '📨',
        description: 'As epístolas universais — Hebreus a Judas.',
        languages: {
            BRASIL: {
                url: 'https://sabercristao.com/cartasuniversais',
                checkoutBasic: 'https://pay.kiwify.com.br/8fUKFtD',
                checkoutFull: 'https://pay.kiwify.com.br/CYtx3n4'
            },
            'PORTUGUÊS': {
                url: 'https://sabercristao.com/cartasuniversaisvpv',
                checkoutBasic: 'https://pay.hotmart.com/Y98868042Q?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/L98868248E?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://sabercristao.com/CARTASUNIVERSALES',
                checkoutBasic: 'https://pay.hotmart.com/F99107782U?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/L99107908T?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://sabercristao.com/generalepistles',
                checkoutBasic: 'https://pay.hotmart.com/N99538838D?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/X99539043O?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://sabercristao.com/lesepitresuniverselles',
                checkoutBasic: 'https://pay.hotmart.com/P101596597Y?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/N101597063B?checkoutMode=10'
            },
            'ALEMÃO': {}
        }
    },
    {
        id: 'apocalipse',
        name: 'Apocalipse',
        category: 'NT',
        icon: '🌟',
        description: 'O livro da Revelação — Apocalipse de João.',
        languages: {
            BRASIL: {
                url: 'https://sabercristao.com/apocalipse',
                checkoutBasic: 'https://pay.kiwify.com.br/orD6JUk',
                checkoutFull: 'https://pay.kiwify.com.br/PoXuv2Y'
            },
            'PORTUGUÊS': {
                url: 'https://sabercristao.com/apocalipsevpv',
                checkoutBasic: 'https://pay.hotmart.com/E97797712P?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/M97798100V?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://sabercristao.com/apocalipsis',
                checkoutBasic: 'https://pay.hotmart.com/D97075949P?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/F97076216U?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://sabercristao.com/revelation',
                checkoutBasic: 'https://pay.hotmart.com/B97207752J?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/F97208105V?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://sabercristao.com/APOCALYPSE',
                checkoutBasic: 'https://pay.hotmart.com/A99276650K?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/W99276769R?checkoutMode=10'
            },
            'ALEMÃO': {
                url: 'https://sabercristao.com/offenbarung',
                checkoutBasic: 'https://pay.hotmart.com/C98282066B?checkoutMode=10',
                checkoutFull: 'https://pay.hotmart.com/O98282192A?checkoutMode=10'
            }
        }
    },
    {
        id: 'combo-profetico',
        name: 'Combo Profético',
        category: 'COMBO',
        icon: '📦',
        description: 'Combo com conteúdo profético completo.',
        languages: {
            BRASIL: {
                url: 'https://sabercristao.com/comboprofetico',
                checkoutBasic: 'https://pay.kiwify.com.br/Cqv6siT'
            },
            'PORTUGUÊS': {
                url: 'https://sabercristao.com/comboprofeticovpv',
                checkoutBasic: 'https://pay.hotmart.com/O101309614E?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://sabercristao.com/comboprofeticoes',
                checkoutBasic: 'https://pay.hotmart.com/I101369877V?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://sabercristao.com/propheticbundle',
                checkoutBasic: 'https://pay.hotmart.com/J101959432A?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://sabercristao.com/comboprophetique',
                checkoutBasic: 'https://pay.hotmart.com/P101808998W?checkoutMode=10'
            },
            'ALEMÃO': {}
        }
    },
    {
        id: 'treinamento-obreiros',
        name: 'Treinamento de Obreiros',
        category: 'COMBO',
        icon: '🎓',
        description: 'Curso de formação e treinamento para obreiros.',
        languages: {
            BRASIL: {},
            'PORTUGUÊS': {},
            ESPANHOL: {
                url: 'https://excel-servant-guide.lovable.app/',
                checkoutBasic: 'https://pay.hotmart.com/A102711485I?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://ministry-workers.lovable.app/',
                checkoutBasic: 'https://pay.hotmart.com/X102797937Q?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://formation-des-ouvriers-v2.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/N102813353I?checkoutMode=10'
            },
            'ALEMÃO': {
                url: 'https://mirarbeiter-schulung.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/K104296323N?checkoutMode=10'
            }
        }
    },
    {
        id: 'geografia-biblica',
        name: 'Geografia Bíblica',
        category: 'COMBO',
        icon: '🗺️',
        description: 'Estudo de geografia bíblica com mapas e contexto histórico.',
        languages: {
            BRASIL: {},
            'PORTUGUÊS': {
                url: 'https://geografia-biblica.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/D103473219G?checkoutMode=10'
            },
            ESPANHOL: {
                url: 'https://geografia-biblica-es.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/X103436167Y?checkoutMode=10'
            },
            'INGLÊS': {
                url: 'https://biblical-geography.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/X103440143K?checkoutMode=10'
            },
            'FRANCÊS': {
                url: 'https://geographie-biblique.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/D103445044A?checkoutMode=10'
            },
            'ALEMÃO': {
                url: 'https://biblische-geographie.netlify.app/',
                checkoutBasic: 'https://pay.hotmart.com/M103507036P?checkoutMode=10'
            }
        }
    }
];

export function getActiveLanguageCount(product) {
    return Object.values(product.languages).filter(
        lang => lang.url || lang.checkoutBasic || lang.checkoutFull
    ).length;
}

export function getTotalActiveLinks() {
    let count = 0;
    products.forEach(p => {
        Object.values(p.languages).forEach(lang => {
            if (lang.url) count++;
            if (lang.checkoutBasic) count++;
            if (lang.checkoutFull) count++;
        });
    });
    return count;
}

export function getProductsByCategory(category) {
    return products.filter(p => p.category === category);
}
