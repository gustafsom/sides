export const vocabularySeed = [
  ['hola','olá','Hola, ¿cómo estás?','Olá, como você está?','A1','saudacoes'],
  ['gracias','obrigado(a)','Muchas gracias por tu ayuda.','Muito obrigado pela sua ajuda.','A1','saudacoes'],
  ['por favor','por favor','Un café, por favor.','Um café, por favor.','A1','cotidiano'],
  ['buenos días','bom dia','Buenos días, ¿en qué puedo ayudarle?','Bom dia, em que posso ajudá-lo?','A1','saudacoes'],
  ['buenas tardes','boa tarde','Buenas tardes, nos vemos mañana.','Boa tarde, nos vemos amanhã.','A1','saudacoes'],
  ['buenas noches','boa noite','Buenas noches, que descanses.','Boa noite, descanse bem.','A1','saudacoes'],
  ['hoy','hoje','Hoy tengo una reunión.','Hoje tenho uma reunião.','A1','tempo'],
  ['mañana','amanhã / manhã','Mañana salimos temprano.','Amanhã saímos cedo.','A1','tempo'],
  ['ayer','ontem','Ayer estudié español.','Ontem estudei espanhol.','A1','tempo'],
  ['comer','comer','Quiero comer algo ligero.','Quero comer algo leve.','A1','verbos'],
  ['beber','beber','Necesito beber agua.','Preciso beber água.','A1','verbos'],
  ['hablar','falar','Quiero hablar español con confianza.','Quero falar espanhol com confiança.','A1','verbos'],
  ['escuchar','escutar','Me gusta escuchar conversaciones reales.','Gosto de escutar conversas reais.','A1','verbos'],
  ['leer','ler','Voy a leer un texto corto.','Vou ler um texto curto.','A1','verbos'],
  ['escribir','escrever','Tengo que escribir un mensaje.','Tenho que escrever uma mensagem.','A1','verbos'],
  ['trabajo','trabalho','Tengo mucho trabajo esta semana.','Tenho muito trabalho esta semana.','A1','cotidiano'],
  ['casa','casa','Mi casa está cerca del centro.','Minha casa fica perto do centro.','A1','cotidiano'],
  ['calle','rua','La farmacia está en esta calle.','A farmácia fica nesta rua.','A1','cidade'],
  ['izquierda','esquerda','Gira a la izquierda en la esquina.','Vire à esquerda na esquina.','A1','cidade'],
  ['derecha','direita','El hotel está a la derecha.','O hotel fica à direita.','A1','cidade'],
  ['cerca','perto','La estación está cerca.','A estação fica perto.','A1','cidade'],
  ['lejos','longe','El aeropuerto está lejos del centro.','O aeroporto fica longe do centro.','A1','cidade'],
  ['entrada','entrada','La entrada está al lado del ascensor.','A entrada fica ao lado do elevador.','A1','viagem'],
  ['salida','saída','¿Dónde está la salida?','Onde fica a saída?','A1','viagem'],
  ['billete','bilhete / passagem','Necesito un billete de ida y vuelta.','Preciso de uma passagem de ida e volta.','A2','viagem'],
  ['equipaje','bagagem','Mi equipaje todavía no llegó.','Minha bagagem ainda não chegou.','A2','viagem'],
  ['desayuno','café da manhã','El desayuno está incluido.','O café da manhã está incluído.','A1','alimentacao'],
  ['almuerzo','almoço','¿A qué hora es el almuerzo?','A que horas é o almoço?','A1','alimentacao'],
  ['cena','jantar','Tenemos una reserva para la cena.','Temos uma reserva para o jantar.','A1','alimentacao'],
  ['cuenta','conta','La cuenta, por favor.','A conta, por favor.','A1','alimentacao'],
  ['todavía','ainda','Todavía no entiendo esta expresión.','Ainda não entendo esta expressão.','A2','conectores'],
  ['aunque','embora / ainda que','Aunque sea difícil, voy a intentarlo.','Embora seja difícil, vou tentar.','B1','conectores'],
  ['sin embargo','no entanto','Estudié mucho; sin embargo, cometí errores.','Estudei muito; no entanto, cometi erros.','B1','conectores'],
  ['darse cuenta','perceber','Me di cuenta de que hablaba demasiado rápido.','Percebi que eu falava rápido demais.','B1','expressoes'],
  ['echar de menos','sentir falta','Echo de menos a mis amigos.','Sinto falta dos meus amigos.','B1','expressoes'],
  ['quedar','combinar / ficar','Quedamos a las ocho frente al hotel.','Combinamos às oito em frente ao hotel.','A2','verbos'],
  ['llevar','levar / usar / estar há','Llevo dos años estudiando español.','Estudo espanhol há dois anos.','B1','verbos'],
  ['acabar de','ter acabado de','Acabo de llegar a casa.','Acabei de chegar em casa.','A2','expressoes'],
  ['soler','costumar','Suelo estudiar por la noche.','Costumo estudar à noite.','B1','verbos'],
  ['aprovechar','aproveitar','Quiero aprovechar mejor mi tiempo.','Quero aproveitar melhor meu tempo.','B1','verbos']
];

export const grammarSeed = [
  { level:'A1', skill:'ser-estar', prompt:'Yo ___ brasileño.', answers:['soy'], explanation:'Use “ser” para nacionalidade: yo soy.' },
  { level:'A1', skill:'ser-estar', prompt:'Madrid ___ en España.', answers:['está'], explanation:'Use “estar” para localização: Madrid está en España.' },
  { level:'A1', skill:'presente', prompt:'Nosotros ___ español todos los días. (estudiar)', answers:['estudiamos'], explanation:'Presente de estudiar para nosotros: estudiamos.' },
  { level:'A1', skill:'artigos', prompt:'Quiero ___ vaso de agua.', answers:['un'], explanation:'“Vaso” é masculino singular e indefinido neste contexto: un vaso de agua.' },
  { level:'A2', skill:'preterito-perfecto', prompt:'Hoy ___ mucho. (trabajar)', answers:['he trabajado'], explanation:'Com “hoy”, o pretérito perfecto é frequente: he trabajado.' },
  { level:'A2', skill:'preterito-indefinido', prompt:'Ayer ___ al centro. (ir)', answers:['fui'], explanation:'“Ayer” favorece uma ação concluída: fui.' },
  { level:'A2', skill:'por-para', prompt:'Este regalo es ___ ti.', answers:['para'], explanation:'Destino/beneficiário: para ti.' },
  { level:'A2', skill:'por-para', prompt:'Caminamos ___ el parque.', answers:['por'], explanation:'Movimento através de um lugar: por el parque.' },
  { level:'B1', skill:'subjuntivo', prompt:'Quiero que tú ___ más despacio. (hablar)', answers:['hables'], explanation:'Depois de “quiero que”, usa-se subjuntivo: hables.' },
  { level:'B1', skill:'condicional', prompt:'Si tuviera tiempo, ___ más. (viajar)', answers:['viajaría'], explanation:'Hipótese pouco provável: si + imperfecto de subjuntivo, condicional.' },
  { level:'B1', skill:'pronombres', prompt:'¿El libro? Ya ___ compré.', answers:['lo'], explanation:'“El libro” é objeto direto masculino singular: lo.' },
  { level:'B2', skill:'conectores', prompt:'No estoy de acuerdo; ___, entiendo tu punto de vista.', answers:['sin embargo','no obstante'], explanation:'“Sin embargo” e “no obstante” introduzem contraste.' }
];

export const listeningSeed = [
  { level:'A1', text:'Buenos días. Quisiera un café con leche y una tostada, por favor.', translation:'Bom dia. Eu gostaria de um café com leite e uma torrada, por favor.' },
  { level:'A1', text:'La estación está a cinco minutos caminando. Sigue todo recto.', translation:'A estação fica a cinco minutos andando. Siga sempre em frente.' },
  { level:'A2', text:'Perdone, ¿podría decirme a qué hora sale el próximo tren?', translation:'Com licença, poderia me dizer a que horas sai o próximo trem?' },
  { level:'A2', text:'He reservado una habitación para dos noches a nombre de García.', translation:'Reservei um quarto por duas noites em nome de García.' },
  { level:'B1', text:'Aunque al principio me costaba entender, poco a poco me acostumbré al acento.', translation:'Embora no início eu tivesse dificuldade para entender, pouco a pouco me acostumei ao sotaque.' },
  { level:'B1', text:'Si hubiera sabido que la reunión terminaba tan tarde, habría organizado el día de otra manera.', translation:'Se eu soubesse que a reunião terminava tão tarde, teria organizado o dia de outra forma.' }
];

export const readingSeed = [
  {
    level:'A1', title:'Una mañana tranquila',
    body:'Ana se levanta a las siete. Prepara café, come una fruta y revisa su agenda. A las ocho sale de casa y va al trabajo en autobús. Durante el trayecto escucha un pódcast corto en español.',
    questions:[
      { q:'¿A qué hora se levanta Ana?', answers:['a las siete','las siete'] },
      { q:'¿Cómo va al trabajo?', answers:['en autobús','autobús'] },
      { q:'¿Qué escucha durante el trayecto?', answers:['un pódcast corto en español','un podcast corto en español','un pódcast','un podcast'] }
    ]
  },
  {
    level:'A2', title:'Un cambio de planes',
    body:'Carlos quería cenar en un restaurante nuevo, pero cuando llegó vio que estaba cerrado. Entonces llamó a una amiga y decidieron comprar ingredientes para cocinar en casa. Al final, prepararon una cena sencilla y pasaron una noche muy agradable.',
    questions:[
      { q:'¿Por qué Carlos no cenó en el restaurante?', answers:['porque estaba cerrado','estaba cerrado'] },
      { q:'¿Qué hicieron después?', answers:['compraron ingredientes para cocinar en casa','comprar ingredientes para cocinar en casa'] }
    ]
  },
  {
    level:'B1', title:'Aprender con constancia',
    body:'Estudiar un idioma durante muchas horas un solo día puede dar una falsa sensación de progreso. En cambio, sesiones más breves y frecuentes obligan al cerebro a recuperar la información varias veces. Esa recuperación, especialmente cuando va acompañada de correcciones, ayuda a consolidar lo aprendido.',
    questions:[
      { q:'¿Qué estrategia recomienda el texto?', answers:['sesiones breves y frecuentes','sesiones más breves y frecuentes'] },
      { q:'¿Qué ayuda a consolidar lo aprendido?', answers:['la recuperación acompañada de correcciones','recuperación y correcciones','la recuperación'] }
    ]
  }
];

export const placementSeed = [
  { level:'A1', prompt:'Yo ___ de Brasil.', answers:['soy'], options:['soy','estoy','es','está'] },
  { level:'A1', prompt:'¿___ cuesta este libro?', answers:['cuánto'], options:['Cuánto','Cuándo','Dónde','Quién'] },
  { level:'A1', prompt:'Ayer ___ una película.', answers:['vi'], options:['veo','vi','he ver','veré'] },
  { level:'A2', prompt:'Este regalo es ___ ti.', answers:['para'], options:['por','para','de','a'] },
  { level:'A2', prompt:'Todavía no ___ terminado.', answers:['he'], options:['he','ha','había','estoy'] },
  { level:'A2', prompt:'Cuando era niño, ___ al fútbol los sábados.', answers:['jugaba'], options:['jugué','jugaba','jugaré','he jugado'] },
  { level:'B1', prompt:'Quiero que me ___ la verdad.', answers:['digas'], options:['dices','dirás','digas','decías'] },
  { level:'B1', prompt:'Si tuviera más tiempo, ___ otro idioma.', answers:['aprendería'], options:['aprendo','aprendería','aprenderé','aprendí'] },
  { level:'B1', prompt:'No fui a la reunión ___ estaba enfermo.', answers:['porque'], options:['para que','aunque','porque','sin embargo'] },
  { level:'B2', prompt:'Por mucho que ___, no cambiará de opinión.', answers:['insistas'], options:['insistes','insistirás','insistas','insistías'] },
  { level:'B2', prompt:'De haberlo sabido, te ___.', answers:['habría avisado'], options:['avisaría','habría avisado','avisaba','he avisado'] },
  { level:'B2', prompt:'No es que no me ___; es que necesito pensarlo.', answers:['guste'], options:['gusta','gustará','guste','gustó'] }
];
