import { curriculumFramework } from './block5-framework.mjs';

const gp = (prompt, answers) => ({prompt,answers:Array.isArray(answers)?answers:[answers]});
const grammarFamilies = [
  {level:'A1',skill:'ser-estar',topic:'identidade',explanation:'Use “ser” para identidade/característica e “estar” para localização/estado.',pairs:[
    gp('Yo ___ brasileño.','soy'),gp('Ella ___ médica.','es'),gp('Nosotros ___ amigos.','somos'),gp('Madrid ___ en España.','está'),gp('El libro ___ en la mesa.','está'),
    gp('Hoy yo ___ cansado.','estoy'),gp('Ellos ___ en casa.','están'),gp('Tú ___ muy amable.','eres'),gp('La reunión ___ a las siete.','es'),gp('Mis padres ___ de Brasil.','son')
  ]},
  {level:'A1',skill:'presente-ar',topic:'rotina',explanation:'No presente, verbos regulares em -ar usam -o, -as, -a, -amos, -áis, -an.',pairs:[
    gp('Yo ___ español. (estudiar)','estudio'),gp('Tú ___ temprano. (trabajar)','trabajas'),gp('Ella ___ con su amiga. (hablar)','habla'),gp('Nosotros ___ cada día. (practicar)','practicamos'),gp('Ellos ___ en casa. (cenar)','cenan'),
    gp('Yo ___ la puerta. (cerrar)','cierro'),gp('Tú ___ el documento. (revisar)','revisas'),gp('Él ___ café. (preparar)','prepara'),gp('Nosotros ___ la reunión. (organizar)','organizamos'),gp('Ustedes ___ mucho. (caminar)','caminan')
  ]},
  {level:'A1',skill:'presente-er-ir',topic:'rotina',explanation:'Observe as terminações do presente nos verbos em -er e -ir e os verbos irregulares frequentes.',pairs:[
    gp('Yo ___ agua. (beber)','bebo'),gp('Tú ___ muy bien. (leer)','lees'),gp('Ella ___ poco. (comer)','come'),gp('Nosotros ___ mensajes. (recibir)','recibimos'),gp('Ellos ___ en Madrid. (vivir)','viven'),
    gp('Yo ___ la respuesta. (escribir)','escribo'),gp('Tú ___ la puerta. (abrir)','abres'),gp('Él ___ ayuda. (pedir)','pide'),gp('Nosotros ___ temprano. (salir)','salimos'),gp('Ustedes ___ la idea. (comprender)','comprenden')
  ]},
  {level:'A1',skill:'articulos',topic:'nomes',explanation:'O artigo concorda com gênero e número: el/la/los/las e un/una/unos/unas.',pairs:[
    gp('Quiero ___ vaso de agua.','un'),gp('Necesito ___ llave.','una'),gp('___ libro está en la mesa.','el'),gp('___ puerta está abierta.','la'),gp('Compré ___ manzanas.','unas'),
    gp('___ niños están en el parque.','los'),gp('___ calles son tranquilas.','las'),gp('Hay ___ hotel cerca.','un'),gp('Busco ___ farmacia.','una'),gp('___ reunión empieza ahora.','la')
  ]},
  {level:'A2',skill:'preterito-indefinido',topic:'experiencias',explanation:'Use o indefinido para ações concluídas em um período terminado.',pairs:[
    gp('Ayer ___ al centro. (ir)','fui'),gp('Anoche ___ temprano. (cenar)','cené'),gp('El lunes ___ el informe. (terminar)','terminé'),gp('La semana pasada ___ a Ana. (ver)','vi'),gp('Ellos ___ tarde. (llegar)','llegaron'),
    gp('Nosotros ___ el billete. (comprar)','compramos'),gp('Tú ___ la verdad. (decir)','dijiste'),gp('Ella ___ un mensaje. (escribir)','escribió'),gp('Yo ___ la reserva. (hacer)','hice'),gp('Ustedes ___ el problema. (resolver)','resolvieron')
  ]},
  {level:'A2',skill:'preterito-perfecto',topic:'experiencias',explanation:'Use “haber + participio” para experiências ou ações ligadas ao período atual.',pairs:[
    gp('Hoy ___ mucho. (trabajar)','he trabajado'),gp('Esta semana ___ dos reuniones. (tener)','he tenido'),gp('Ya ___ el mensaje. (enviar)','he enviado'),gp('Todavía no ___ la respuesta. (recibir)','he recibido'),gp('Ella ___ el documento. (leer)','ha leído'),
    gp('Nosotros ___ el plan. (cambiar)','hemos cambiado'),gp('¿Tú ___ en España? (estar)','has estado'),gp('Ellos ___ temprano. (llegar)','han llegado'),gp('Ustedes ___ una decisión. (tomar)','han tomado'),gp('Yo nunca ___ eso. (hacer)','he hecho')
  ]},
  {level:'A2',skill:'imperfecto',topic:'passado',explanation:'O imperfecto descreve hábitos, contexto e ações em andamento no passado.',pairs:[
    gp('Cuando era niño, ___ al fútbol. (jugar)','jugaba'),gp('Antes ___ cerca del trabajo. (vivir)','vivía'),gp('Ella siempre ___ temprano. (llegar)','llegaba'),gp('Nosotros ___ cuando llamaste. (cenar)','cenábamos'),gp('Ellos ___ mucho. (viajar)','viajaban'),
    gp('Yo ___ una duda. (tener)','tenía'),gp('Tú ___ muy rápido. (hablar)','hablabas'),gp('La tienda ___ abierta. (estar)','estaba'),gp('Ustedes ___ juntos. (trabajar)','trabajaban'),gp('De pequeño me ___ leer. (gustar)','gustaba')
  ]},
  {level:'A2',skill:'por-para',topic:'preposicoes',explanation:'“Para” tende a indicar destino, finalidade ou destinatário; “por” causa, meio, troca ou percurso.',pairs:[
    gp('Este regalo es ___ ti.','para'),gp('Caminamos ___ el parque.','por'),gp('Estudio ___ hablar mejor.','para'),gp('Gracias ___ tu ayuda.','por'),gp('Salimos ___ Madrid mañana.','para'),
    gp('Te llamo ___ teléfono.','por'),gp('Trabajo ___ una empresa internacional.','para'),gp('Lo hice ___ necesidad.','por'),gp('Necesito el informe ___ mañana.','para'),gp('Pasamos ___ el centro.','por')
  ]},
  {level:'B1',skill:'subjuntivo-voluntad',topic:'subjuntivo',explanation:'Desejo, pedido, recomendação ou necessidade com sujeitos diferentes costuma introduzir subjuntivo.',pairs:[
    gp('Quiero que tú ___ más despacio. (hablar)','hables'),gp('Espero que ellos ___. (venir)','vengan'),gp('Necesito que usted me ___. (ayudar)','ayude'),gp('Prefiero que nosotros ___ antes. (salir)','salgamos'),gp('Te recomiendo que ___ el texto. (leer)','leas'),
    gp('Es importante que ellos ___. (participar)','participen'),gp('Quiero que ella lo ___. (hacer)','haga'),gp('Pedimos que ustedes ___. (esperar)','esperen'),gp('Ojalá todo ___ bien. (salir)','salga'),gp('Conviene que tú lo ___. (revisar)','revises')
  ]},
  {level:'B1',skill:'subjuntivo-opinion',topic:'subjuntivo',explanation:'Negação, dúvida e avaliação podem acionar o subjuntivo quando a informação não é apresentada como fato.',pairs:[
    gp('No creo que ___ suficiente. (ser)','sea'),gp('Dudo que ellos ___ hoy. (venir)','vengan'),gp('No parece que él lo ___. (saber)','sepa'),gp('Es posible que ___ tarde. (llegar)','llegue'),gp('Puede que nosotros ___ el plan. (cambiar)','cambiemos'),
    gp('No pienso que eso ___ fácil. (ser)','sea'),gp('Es probable que ella ___. (llamar)','llame'),gp('No está claro que ___ tiempo. (haber)','haya'),gp('Tal vez ellos no lo ___. (entender)','entiendan'),gp('No es seguro que ___ mañana. (abrir)','abra')
  ]},
  {level:'B1',skill:'condicional',topic:'hipoteses',explanation:'Para hipóteses pouco prováveis, use “si + imperfecto de subjuntivo” e condicional no resultado.',pairs:[
    gp('Si tuviera tiempo, ___ más. (viajar)','viajaría'),gp('Si pudiera, te ___. (ayudar)','ayudaría'),gp('Si supiéramos la respuesta, la ___. (decir)','diríamos'),gp('Si él viniera, ___ mejor. (ser)','sería'),gp('Si lloviera, nos ___. (quedar)','quedaríamos'),
    gp('Si tuvieras dinero, ¿lo ___? (comprar)','comprarías'),gp('Si fuera necesario, ___ el plan. (cambiar)','cambiaría'),gp('Si ellos estudiaran, ___ más. (aprender)','aprenderían'),gp('Si pudiera elegir, ___ temprano. (salir)','saldría'),gp('Si estuvieras aquí, lo ___. (ver)','verías')
  ]},
  {level:'B1',skill:'pronombres',topic:'pronombres',explanation:'Use pronomes átonos para retomar objetos sem repetir o substantivo.',pairs:[
    gp('¿El libro? Ya ___ compré.','lo'),gp('¿La carta? Ya ___ envié.','la'),gp('¿Los documentos? ___ revisé ayer.','los'),gp('¿Las llaves? No ___ encuentro.','las'),gp('A Marta ___ llamé por la tarde.','la'),
    gp('A mis padres ___ veo mañana.','los'),gp('El correo ___ recibí hoy.','lo'),gp('La respuesta no ___ sé.','la'),gp('Esos temas ___ hablamos después.','los'),gp('Las fotos ___ guardé aquí.','las')
  ]},
  {level:'B2',skill:'conectores',topic:'argumentacao',explanation:'Conectores organizam contraste, consequência, concessão e reformulação.',pairs:[
    gp('No estoy de acuerdo; ___, entiendo tu punto.',['sin embargo','no obstante']),gp('El plazo terminó; ___, debemos decidir.',['por lo tanto','por consiguiente']),gp('La idea es útil; ___, tiene límites.',['sin embargo','no obstante']),gp('No solo estudió; ___, practicó cada día.','además'),gp('El dato parece claro; ___, conviene verificarlo.',['aun así','sin embargo']),
    gp('No era obligatorio; ___, lo hizo.',['aun así','sin embargo']),gp('La solución es cara; ___, es eficaz.',['por otra parte','sin embargo']),gp('Hubo errores; ___, el resultado mejoró.',['a pesar de ello','aun así']),gp('No tenemos pruebas; ___, es solo una hipótesis.',['por lo tanto','por consiguiente']),gp('La propuesta cambia el método; ___, no cambia el objetivo.',['sin embargo','no obstante'])
  ]},
  {level:'B2',skill:'hipotesis-pasadas',topic:'hipoteses',explanation:'Em hipóteses passadas não realizadas, use pluscuamperfecto de subjuntivo e condicional compuesto.',pairs:[
    gp('Si lo hubiera sabido, te ___. (avisar)','habría avisado'),gp('Si hubiéramos salido antes, no ___. (llegar tarde)','habríamos llegado tarde'),gp('Si ella hubiera venido, lo ___. (ver)','habría visto'),gp('Si hubieras estudiado, ___. (aprobar)','habrías aprobado'),gp('Si ellos hubieran preguntado, les ___. (responder)','habríamos respondido'),
    gp('De haber tenido tiempo, lo ___. (revisar)','habría revisado'),gp('Si no hubiera llovido, ___. (salir)','habríamos salido'),gp('Si hubieras llamado, te ___. (ayudar)','habría ayudado'),gp('Si lo hubieran entendido, no ___. (protestar)','habrían protestado'),gp('De haberlo visto, lo ___. (recordar)','habría recordado')
  ]},
  {level:'B2',skill:'estilo-indirecto',topic:'discurso',explanation:'No estilo indireto, ajuste tempos e referências quando o ponto de vista temporal muda.',pairs:[
    gp('Dijo: “Estoy cansado”. → Dijo que ___ cansado.','estaba'),gp('Dijo: “Iré mañana”. → Dijo que ___ al día siguiente.','iría'),gp('Dijo: “He terminado”. → Dijo que ___.','había terminado'),gp('Preguntó: “¿Vienes?”. → Preguntó si ___.','venía'),gp('Dijo: “No puedo”. → Dijo que no ___.','podía'),
    gp('Dijo: “Lo haré”. → Dijo que lo ___.','haría'),gp('Comentó: “Vivo aquí”. → Comentó que ___ allí.','vivía'),gp('Afirmó: “Ya lo sé”. → Afirmó que ya lo ___.','sabía'),gp('Preguntó: “¿Has leído?”. → Preguntó si ___.','había leído'),gp('Dijo: “Llegamos ayer”. → Dijo que ___ el día anterior.','habían llegado')
  ]},
  {level:'B2',skill:'concesivas',topic:'argumentacao',explanation:'Concessivas com “aunque”, “por más que” ou “aun cuando” permitem reconhecer um obstáculo sem abandonar a tese.',pairs:[
    gp('Por más que ___, no cambiará de opinión. (insistir)','insistas'),gp('Aunque ___ difícil, lo intentaremos. (ser)','sea'),gp('Aun cuando no ___ acuerdo, podemos hablar. (haber)','haya'),gp('Por mucho que ___, necesita descansar. (trabajar)','trabaje'),gp('Aunque no lo ___, seguiré. (entender)','entiendas'),
    gp('Aun cuando ___ tiempo, no bastará. (haber)','haya'),gp('Por más que lo ___, no aparece. (buscar)','busquemos'),gp('Aunque ___ razón, cuida el tono. (tener)','tengas'),gp('Por poco que ___, ayuda. (hacer)','hagas'),gp('Aun cuando ___ tarde, terminaremos. (ser)','sea')
  ]}
];

export const block5Grammar = grammarFamilies.flatMap((family,familyIndex) =>
  family.pairs.map((pair,index) => ({
    code:`b5:g:${family.level}:${familyIndex+1}:${index+1}`,
    level:family.level,skill:family.skill,prompt:pair.prompt,answers:pair.answers,
    explanation:family.explanation,topic:family.topic,difficulty:curriculumFramework[family.level].difficulty,
    prerequisites: family.level==='A1'?[]:family.level==='A2'?['grammar:presente-ar']:family.level==='B1'?['grammar:preterito-indefinido']:['grammar:subjuntivo-voluntad']
  }))
);