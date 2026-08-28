const option=(id,intent,label,model,keywords,next,response,{repair=false}={})=>({id,intent,label,model,keywords,next,response,repair});
const node=(id,speaker,text,task,options)=>({id,speaker,text,task,options});
const scenario=(id,level,topic,title,setting,targetSkills,nodes)=>({id,level,topic,title,setting,targetSkills,nodes,startNode:nodes[0].id,targetMinutes:10});

export const IMMERSION_SCENARIOS=[
scenario('a1-saludo','A1','daily','Conocer a alguien','Primer encuentro en un espacio cotidiano.',['writing:pt-interference','speaking:text-correspondence'],[
 node('n1','Lucía','¡Hola! Soy Lucía. ¿Cómo te llamas?','Preséntate con tu nombre.',[
  option('o1','introduce','Me llamo…','Me llamo Gustavo.',['me llamo','soy'],'n2','Mucho gusto. ¿De dónde eres?'),
  option('o2','greet','Hola','Hola, mucho gusto.',['hola'],'n1','¡Hola! Ahora dime tu nombre.',{repair:true})]),
 node('n2','Lucía','¿De dónde eres?','Di tu país o ciudad de origen.',[
  option('o1','origin','Soy de…','Soy de Brasil.',['soy de','vengo de'],'n3','Qué bien. ¿Vives aquí ahora?'),
  option('o2','location','Vivo en…','Vivo en Fortaleza.',['vivo en'],'n3','Entiendo. ¿Y qué te gusta hacer?')]),
 node('n3','Lucía','¿Qué te gusta hacer en tu tiempo libre?','Menciona una actividad.',[
  option('o1','hobby','Me gusta…','Me gusta caminar y estudiar español.',['me gusta','me encanta'],'end','¡Qué buena combinación! Ha sido un placer conocerte.'),
  option('o2','hobby','Prefiero…','Prefiero leer.',['prefiero'],'end','Muy bien. Gracias por la conversación.')])]),
scenario('a1-cafe','A1','food','Pedir en una cafetería','Una cafetería de barrio.',['writing:gender-number','writing:preposition'],[
 node('n1','Camarera','Buenas tardes. ¿Qué desea tomar?','Pide una bebida.',[
  option('o1','order','Quisiera…','Quisiera un café con leche, por favor.',['quisiera','quiero','me gustaría'],'n2','Claro. ¿Algo para comer?'),
  option('o2','ask','¿Qué recomienda?','¿Qué recomienda?',['recomienda'],'n2','La tostada está muy buena. ¿Quiere una?')]),
 node('n2','Camarera','¿Algo para comer?','Acepta o rechaza y completa el pedido.',[
  option('o1','accept','Sí, una…','Sí, una tostada, por favor.',['sí','una','un'],'n3','Perfecto. ¿Aquí o para llevar?'),
  option('o2','decline','No, gracias','No, gracias. Solo el café.',['no gracias','solo'],'n3','De acuerdo. ¿Aquí o para llevar?')]),
 node('n3','Camarera','¿Aquí o para llevar?','Elige una opción.',[
  option('o1','here','Aquí','Aquí, por favor.',['aquí'],'end','Perfecto. Son tres euros con veinte.'),
  option('o2','takeaway','Para llevar','Para llevar, por favor.',['para llevar'],'end','Perfecto. Lo preparo enseguida.')])]),
scenario('a1-direcciones','A1','travel','Preguntar cómo llegar','Estás caminando por una ciudad nueva.',['writing:preposition','speaking:text-correspondence'],[
 node('n1','Vecino','Hola. ¿Te puedo ayudar?','Pregunta dónde está la estación.',[
  option('o1','ask-place','¿Dónde está…?','¿Dónde está la estación, por favor?',['dónde está','estación'],'n2','Está a dos calles. Sigue recto y gira a la derecha.'),
  option('o2','ask-route','¿Cómo llego…?','¿Cómo llego a la estación?',['cómo llego','estación'],'n2','Sigue recto y gira a la derecha en el semáforo.')]),
 node('n2','Vecino','Sigue recto y gira a la derecha en el semáforo.','Confirma que entendiste.',[
  option('o1','confirm','Entonces…','Entonces, sigo recto y giro a la derecha.',['entonces','recto','derecha'],'n3','Exactamente.'),
  option('o2','repeat','¿A la derecha?','¿A la derecha en el semáforo?',['derecha','semáforo'],'n3','Sí, allí mismo.')]),
 node('n3','Vecino','¿Necesitas algo más?','Agradece y despídete.',[
  option('o1','thanks','Muchas gracias','Muchas gracias por la ayuda.',['gracias'],'end','De nada. ¡Buen viaje!')])]),
scenario('a1-tienda','A1','shopping','Comprar una prenda','Una tienda de ropa.',['writing:gender-number','writing:accent-spelling'],[
 node('n1','Dependiente','Hola. ¿Qué buscas?','Di qué prenda necesitas.',[
  option('o1','need','Busco…','Busco una camisa azul.',['busco','necesito'],'n2','Tenemos varias. ¿Qué talla usas?')]),
 node('n2','Dependiente','¿Qué talla usas?','Indica una talla o pregunta por otra.',[
  option('o1','size','Uso la talla…','Uso la talla M.',['talla'],'n3','Aquí tienes. ¿Quieres probártela?'),
  option('o2','ask-size','¿Tiene talla…?','¿Tiene talla M?',['tiene talla'],'n3','Sí. Aquí la tienes. ¿Quieres probártela?')]),
 node('n3','Dependiente','¿Quieres probártela?','Acepta y pregunta dónde.',[
  option('o1','try','Sí. ¿Dónde…?','Sí. ¿Dónde está el probador?',['sí','dónde','probador'],'end','Al fondo, a la izquierda.')])]),
scenario('a1-hotel','A1','travel','Llegar al hotel','Recepción de un hotel.',['writing:verb','writing:preposition'],[
 node('n1','Recepcionista','Buenas noches. ¿Tiene una reserva?','Confirma la reserva.',[
  option('o1','reservation','Sí, a nombre de…','Sí, a nombre de Gustavo Lopes.',['reserva','nombre','a nombre'],'n2','Perfecto. ¿Me muestra su documento?')]),
 node('n2','Recepcionista','¿Me muestra su documento?','Entrega el documento de forma cortés.',[
  option('o1','give','Claro, aquí tiene','Claro, aquí tiene.',['aquí tiene','claro'],'n3','Gracias. El desayuno es de siete a diez.')]),
 node('n3','Recepcionista','¿Tiene alguna pregunta?','Pregunta por el wifi.',[
  option('o1','wifi','¿Cuál es la clave…?','¿Cuál es la clave del wifi?',['clave','wifi'],'end','La clave es VIAJE2026. Que descanse.')])]),
scenario('a1-familia','A1','daily','Hablar de la familia','Conversación informal.',['writing:ser-estar','writing:gender-number'],[
 node('n1','Ana','¿Tienes hermanos?','Responde y da una cantidad.',[
  option('o1','family','Tengo…','Sí. Tengo una hermana.',['tengo','hermana','hermano'],'n2','¿Cómo se llama?'),
  option('o2','none','No tengo','No, no tengo hermanos.',['no tengo'],'n2','Entiendo. ¿Vives con tu familia?')]),
 node('n2','Ana','Cuéntame un poco de tu familia.','Da un dato sencillo.',[
  option('o1','describe','Mi… es…','Mi familia es grande y vivimos cerca.',['mi familia','vivimos','es'],'n3','Qué bien.'),
  option('o2','describe','Vivo con…','Vivo con mi esposa y mis hijos.',['vivo con'],'n3','Qué bonito.')]),
 node('n3','Ana','Gracias por contarme.','Responde de forma natural.',[
  option('o1','close','De nada','De nada. Me gusta hablar de mi familia.',['de nada','familia'],'end','A mí también.')])]),
scenario('a1-congregacion','A1','congregation','Saludar en la congregación','Antes de una reunión.',['writing:pt-interference','speaking:text-correspondence'],[
 node('n1','Carlos','¡Hola! No creo que nos conozcamos. Soy Carlos.','Preséntate.',[
  option('o1','introduce','Mucho gusto…','Mucho gusto. Me llamo Gustavo.',['mucho gusto','me llamo','soy'],'n2','Encantado. ¿Hace mucho que vienes aquí?')]),
 node('n2','Carlos','¿Hace mucho que vienes a esta congregación?','Explica de forma breve.',[
  option('o1','recent','Hace poco…','Hace poco. Todavía estoy conociendo a todos.',['hace poco','todavía'],'n3','Pues bienvenido. ¿Te está resultando fácil el español?'),
  option('o2','time','Desde hace…','Vengo desde hace unas semanas.',['desde hace','semanas'],'n3','Qué bien. ¿Te está resultando fácil el español?')]),
 node('n3','Carlos','¿Te está resultando fácil el español?','Responde con sinceridad y una meta.',[
  option('o1','learning','Estoy aprendiendo','Estoy aprendiendo. Quiero entender mejor y comentar con más naturalidad.',['aprendiendo','quiero','comentar'],'end','Seguro que lo conseguirás. Podemos practicar cuando quieras.')])]),
scenario('a1-cita','A1','daily','Combinar un horario','Quieres encontrarte con un amigo.',['writing:preposition','writing:punctuation'],[
 node('n1','Diego','¿Nos vemos mañana?','Propón una hora.',[
  option('o1','time','A las…','Sí. ¿A las cinco está bien?',['a las','cinco','seis'],'n2','A las cinco me viene bien. ¿Dónde?')]),
 node('n2','Diego','¿Dónde quedamos?','Propón un lugar.',[
  option('o1','place','En…','En la entrada del parque.',['en la','parque','entrada'],'n3','Perfecto.')]),
 node('n3','Diego','Entonces mañana a las cinco.','Confirma el plan.',[
  option('o1','confirm','Perfecto, nos vemos','Perfecto. Nos vemos mañana.',['nos vemos','perfecto'],'end','¡Hasta mañana!')])]),

scenario('a2-restaurante','A2','food','Resolver un problema en el restaurante','Tu pedido llegó equivocado.',['writing:register','writing:verb'],[
 node('n1','Camarero','Aquí tiene su plato.','Explica con cortesía que no es lo que pediste.',[
  option('o1','complain','Perdone, pedí…','Perdone, pedí pescado, no carne.',['perdone','pedí','no'],'n2','Disculpe. Se lo cambio enseguida.'),
  option('o2','clarify','Creo que…','Creo que hubo un error con mi pedido.',['creo','error','pedido'],'n2','Lo siento. ¿Qué había pedido?')]),
 node('n2','Camarero','¿Qué había pedido exactamente?','Aclara el pedido.',[
  option('o1','order','Había pedido…','Había pedido el pescado con verduras.',['había pedido','pescado'],'n3','Entendido. Tardará unos diez minutos.')]),
 node('n3','Camarero','Tardará unos diez minutos. ¿Está bien?','Acepta o pide una alternativa.',[
  option('o1','accept','Sí, está bien','Sí, está bien. Gracias por solucionarlo.',['está bien','gracias'],'end','Gracias por su comprensión.'),
  option('o2','alternative','¿Podría traer…?','¿Podría traerme una ensalada mientras espero?',['podría','mientras'],'end','Por supuesto.')])]),
scenario('a2-aeropuerto','A2','travel','Equipaje en el aeropuerto','Tu maleta no aparece.',['writing:past','writing:preposition'],[
 node('n1','Agente','¿En qué puedo ayudarle?','Explica que tu maleta no llegó.',[
  option('o1','lost-bag','Mi maleta no…','Mi maleta no ha salido en la cinta.',['maleta','no ha','cinta'],'n2','Entiendo. ¿De qué vuelo viene?')]),
 node('n2','Agente','¿Cuál era su vuelo?','Da la información del vuelo.',[
  option('o1','flight','Venía en…','Venía en el vuelo 432 desde Nueva York.',['vuelo','desde','venía'],'n3','Gracias. ¿Puede describir la maleta?')]),
 node('n3','Agente','¿Cómo es la maleta?','Describe color y tamaño.',[
  option('o1','describe','Es…','Es una maleta grande, negra, con una cinta roja.',['grande','negra','roja'],'end','Perfecto. Vamos a iniciar la búsqueda.')])]),
scenario('a2-farmacia','A2','health','Pedir ayuda en una farmacia','Necesitas un producto de venta libre.',['writing:verb','writing:register'],[
 node('n1','Farmacéutica','Buenas. ¿Qué necesita?','Describe un síntoma sencillo sin diagnosticarte.',[
  option('o1','symptom','Tengo…','Tengo dolor de garganta desde ayer.',['tengo','dolor','desde ayer'],'n2','¿Tiene fiebre o algún otro síntoma?')]),
 node('n2','Farmacéutica','¿Tiene fiebre?','Responde con la información que tienes.',[
  option('o1','no-fever','No, solo…','No tengo fiebre. Solo me molesta la garganta.',['no tengo','solo','garganta'],'n3','De acuerdo. Puedo indicarle opciones de alivio y cuándo consultar a un médico.')]),
 node('n3','Farmacéutica','¿Quiere que le explique cómo se usa?','Pide instrucciones.',[
  option('o1','instructions','Sí, por favor','Sí, por favor. ¿Cómo debo usarlo?',['cómo','usar','debo'],'end','Claro. Lea también las indicaciones del envase.')])]),
scenario('a2-transporte','A2','travel','Retraso de transporte','Tu tren tiene retraso.',['writing:future','writing:preposition'],[
 node('n1','Empleado','El tren de las 18:20 lleva cuarenta minutos de retraso.','Pregunta por una alternativa.',[
  option('o1','alternative','¿Hay otro…?','¿Hay otro tren que salga antes?',['hay otro','salga','antes'],'n2','Hay un autobús directo a las 18:45.')]),
 node('n2','Empleado','Puede tomar el autobús de las 18:45.','Pregunta si sirve el mismo billete.',[
  option('o1','ticket','¿Puedo usar…?','¿Puedo usar el mismo billete?',['mismo billete','puedo usar'],'n3','Sí, su billete es válido.')]),
 node('n3','Empleado','El autobús sale de la puerta 6.','Confirma la información.',[
  option('o1','confirm','Entonces…','Entonces, puedo usar este billete y voy a la puerta 6.',['entonces','puerta 6','billete'],'end','Exactamente. Buen viaje.')])]),
scenario('a2-casa','A2','daily','Problema en el apartamento','Hablas con la persona responsable del alojamiento.',['writing:past','writing:register'],[
 node('n1','Responsable','Hola, ¿qué ocurre?','Explica el problema.',[
  option('o1','problem','No funciona…','No funciona el agua caliente desde esta mañana.',['no funciona','agua caliente','desde'],'n2','Lo siento. Voy a enviar a alguien.')]),
 node('n2','Responsable','El técnico puede ir entre las cuatro y las seis.','Di si ese horario te sirve.',[
  option('o1','available','Sí, estaré…','Sí, estaré en casa a esa hora.',['estaré','en casa'],'n3','Perfecto.'),
  option('o2','change','¿Podría ser…?','¿Podría ser después de las seis?',['podría','después'],'n3','Voy a comprobar si es posible.')]),
 node('n3','Responsable','Le confirmaré el horario por mensaje.','Agradece y resume.',[
  option('o1','thanks','Gracias…','Gracias. Quedo pendiente de la confirmación.',['gracias','pendiente','confirmación'],'end','De acuerdo.')])]),
scenario('a2-trabajo','A2','work','Hablar de una tarea','Conversación breve con un compañero.',['writing:past','writing:connectors'],[
 node('n1','Marta','¿Cómo va la tarea que empezaste ayer?','Explica el estado.',[
  option('o1','progress','Ya he…','Ya he terminado la primera parte, pero me falta revisar los datos.',['he terminado','me falta','pero'],'n2','¿Necesitas ayuda con algo?')]),
 node('n2','Marta','¿Necesitas ayuda?','Pide ayuda concreta o recházala.',[
  option('o1','ask-help','¿Podrías…?','¿Podrías revisar conmigo los datos mañana?',['podrías','revisar','mañana'],'n3','Sí, tengo tiempo por la mañana.'),
  option('o2','decline','Por ahora…','Por ahora no, gracias. Te aviso si surge algo.',['por ahora','te aviso'],'n3','Perfecto.')]),
 node('n3','Marta','Entonces seguimos mañana.','Cierra la conversación.',[
  option('o1','close','De acuerdo','De acuerdo. Gracias por la ayuda.',['de acuerdo','gracias'],'end','Nos vemos mañana.')])]),
scenario('a2-congregacion','A2','congregation','Organizar una práctica','Quieres practicar español con alguien de la congregación.',['writing:preposition','writing:register'],[
 node('n1','Elena','Me dijiste que querías practicar más español.','Propón una práctica concreta.',[
  option('o1','propose','Podríamos…','Podríamos practicar comentarios breves después de la reunión.',['podríamos','practicar','después'],'n2','Me parece bien. ¿Qué día te viene mejor?')]),
 node('n2','Elena','¿Qué día te viene mejor?','Propón día y duración.',[
  option('o1','schedule','El jueves…','El jueves. Podemos practicar quince minutos.',['jueves','quince minutos'],'n3','Perfecto. Podemos elegir un tema sencillo.')]),
 node('n3','Elena','¿Qué quieres trabajar primero?','Indica una necesidad lingüística.',[
  option('o1','goal','Quiero mejorar…','Quiero mejorar la naturalidad y usar menos portugués al hablar.',['quiero mejorar','naturalidad','portugués'],'end','Muy buena meta. Empezamos con eso.')])]),
scenario('a2-invitacion','A2','daily','Aceptar una invitación','Un amigo propone un plan de fin de semana.',['writing:future','writing:register'],[
 node('n1','Pablo','El sábado vamos a hacer una caminata. ¿Te apetece venir?','Acepta o rechaza con motivo.',[
  option('o1','accept','Sí, me apetece','Sí, me apetece. ¿A qué hora salimos?',['me apetece','qué hora'],'n2','A las ocho.'),
  option('o2','decline','No puedo porque…','Me gustaría, pero no puedo porque ya tengo un compromiso.',['me gustaría','pero','porque'],'n2','No pasa nada. Quizá la próxima vez.')]),
 node('n2','Pablo','¿Quieres que te mande la ubicación?','Responde.',[
  option('o1','location','Sí, mándamela','Sí, mándamela por mensaje, por favor.',['mándamela','mensaje'],'n3','Perfecto.'),
  option('o2','close','Gracias','Gracias. La próxima vez me apunto.',['gracias','próxima'],'n3','Hecho.')]),
 node('n3','Pablo','Entonces estamos en contacto.','Despídete naturalmente.',[
  option('o1','bye','Hasta luego','Perfecto. Hablamos luego.',['hablamos','luego'],'end','¡Hasta luego!')])]),

scenario('b1-reclamacion','B1','travel','Reclamar un servicio','El alojamiento no coincide con la reserva.',['writing:register','writing:connectors'],[
 node('n1','Recepcionista','¿Qué problema ha encontrado con la habitación?','Explica el problema con hechos.',[
  option('o1','complain','La reserva indicaba…','La reserva indicaba una habitación tranquila, pero esta da a una avenida muy ruidosa.',['reserva','pero','ruidosa'],'n2','Comprendo. Ahora mismo tenemos pocas habitaciones disponibles.')]),
 node('n2','Recepcionista','Podría ofrecerle un cambio mañana.','Negocia una solución razonable.',[
  option('o1','negotiate','Mientras tanto…','De acuerdo, pero mientras tanto ¿sería posible cambiarme a una planta más alta?',['mientras tanto','sería posible','cambiar'],'n3','Voy a comprobarlo.'),
  option('o2','compensation','¿Podrían…?','Si no es posible cambiar hoy, ¿podrían ofrecer alguna alternativa para reducir el ruido?',['si no','podrían','alternativa'],'n3','Voy a revisar qué podemos hacer.')]),
 node('n3','Recepcionista','Tengo una habitación en la sexta planta.','Acepta y confirma condiciones.',[
  option('o1','accept','Me parece…','Me parece una buena solución. ¿Mantiene las mismas condiciones de la reserva?',['me parece','mismas condiciones'],'end','Sí, exactamente. Preparo el cambio.')])]),
scenario('b1-reunion','B1','work','Participar en una reunión','Reunión de seguimiento de un proyecto.',['writing:connectors','writing:register'],[
 node('n1','Coordinador','¿Cómo estamos con el plazo de entrega?','Da estado, riesgo y causa.',[
  option('o1','status','Vamos bien, aunque…','Vamos bien, aunque existe un riesgo porque aún falta validar dos datos importantes.',['aunque','riesgo','porque'],'n2','¿Qué propones para evitar el retraso?')]),
 node('n2','Coordinador','¿Qué propones?','Propón una acción concreta.',[
  option('o1','proposal','Propongo que…','Propongo que hagamos la validación hoy y dejemos mañana solo para ajustes.',['propongo que','hoy','mañana'],'n3','Me parece viable. ¿Quién puede encargarse?')]),
 node('n3','Coordinador','¿Quién puede encargarse?','Asume o distribuye responsabilidad.',[
  option('o1','ownership','Yo puedo…','Yo puedo coordinar la validación y pedir apoyo para la segunda revisión.',['yo puedo','coordinar','apoyo'],'end','Perfecto. Queda acordado.')])]),
scenario('b1-viaje','B1','travel','Cambiar un itinerario','Un vuelo fue cancelado.',['writing:conditionals','writing:register'],[
 node('n1','Agente','Su vuelo fue cancelado por motivos operativos.','Explica tu restricción principal.',[
  option('o1','constraint','Necesito llegar…','Necesito llegar antes de mañana al mediodía porque tengo una cita importante.',['necesito llegar','antes de','porque'],'n2','Hay una ruta con escala que llega a las diez.')]),
 node('n2','Agente','La alternativa tiene una escala de tres horas.','Evalúa y pregunta por el equipaje.',[
  option('o1','baggage','Me sirve si…','Me sirve si el equipaje se transfiere automáticamente. ¿Tengo que recogerlo en la escala?',['me sirve si','equipaje','recogerlo'],'n3','No, se transfiere directamente.')]),
 node('n3','Agente','¿Confirmamos el cambio?','Confirma y pide comprobante.',[
  option('o1','confirm','Sí. ¿Podría…?','Sí, confirmemos el cambio. ¿Podría enviarme el nuevo itinerario por correo?',['confirmemos','podría','itinerario'],'end','Claro. Se lo envío ahora.')])]),
scenario('b1-opinion','B1','media','Dar una opinión equilibrada','Conversación sobre redes sociales.',['writing:connectors','writing:style'],[
 node('n1','Sofía','¿Crees que las redes sociales ayudan a comunicarnos mejor?','Da una opinión con matiz.',[
  option('o1','balanced','Depende…','Depende. Facilitan el contacto, pero también pueden hacer que las conversaciones sean más superficiales.',['depende','pero también'],'n2','¿Qué crees que ayuda a usarlas mejor?')]),
 node('n2','Sofía','¿Cómo las usarías de forma más saludable?','Propón dos medidas.',[
  option('o1','measures','Por un lado…','Por un lado, limitaría las notificaciones y, por otro, reservaría tiempo para conversaciones cara a cara.',['por un lado','por otro','limitaría'],'n3','Tiene sentido. ¿Lo haces ya?')]),
 node('n3','Sofía','¿Ya aplicas esas medidas?','Da un ejemplo personal.',[
  option('o1','example','He empezado…','He empezado a dejar el teléfono lejos cuando estoy hablando con alguien.',['he empezado','cuando'],'end','Es una medida sencilla y útil.')])]),
scenario('b1-medico','B1','health','Explicar un problema en consulta','Consulta médica general.',['writing:past','writing:connectors'],[
 node('n1','Profesional','Cuénteme qué ha estado notando.','Describe duración, intensidad y contexto sin autodiagnóstico.',[
  option('o1','symptoms','Desde hace…','Desde hace tres días tengo dolor de cabeza, sobre todo por la tarde, y empeora cuando paso muchas horas frente a la pantalla.',['desde hace','sobre todo','cuando'],'n2','¿Ha cambiado algo en su rutina estos días?')]),
 node('n2','Profesional','¿Ha habido cambios recientes?','Menciona un cambio relevante.',[
  option('o1','change','Últimamente…','Últimamente he dormido menos porque he tenido más trabajo.',['últimamente','he dormido','porque'],'n3','Entiendo. Voy a hacerle unas preguntas más.')]),
 node('n3','Profesional','¿Hay algo más que considere importante?','Añade o niega información.',[
  option('o1','add','También…','También he notado cansancio, pero no he tenido fiebre.',['también','pero no'],'end','Gracias. Con esos datos podemos orientar mejor la evaluación.')])]),
scenario('b1-colaboracion','B1','work','Resolver un desacuerdo de trabajo','Dos personas proponen métodos distintos.',['writing:register','writing:connectors'],[
 node('n1','Javier','Yo haría todo de una vez para terminar antes.','Discrepa sin confrontar.',[
  option('o1','disagree','Entiendo tu punto, pero…','Entiendo tu punto, pero me preocupa que revisarlo todo al final aumente el riesgo de errores.',['entiendo','pero','me preocupa'],'n2','¿Qué alternativa propones?')]),
 node('n2','Javier','¿Cómo lo organizarías?','Propón un compromiso.',[
  option('o1','compromise','Podríamos…','Podríamos dividirlo en dos bloques y hacer una revisión breve después de cada uno.',['podríamos','dos bloques','después'],'n3','Eso no debería retrasarnos demasiado.')]),
 node('n3','Javier','Me parece razonable.','Cierra con acuerdo y próximo paso.',[
  option('o1','agreement','Entonces…','Entonces hacemos el primer bloque hoy y revisamos el resultado antes de seguir.',['entonces','hoy','antes de'],'end','De acuerdo.')])]),
scenario('b1-congregacion','B1','congregation','Conversar después de la reunión','Hablas sobre cómo mejorar tus comentarios en español.',['writing:register','writing:connectors'],[
 node('n1','Raúl','Tus comentarios se entienden bien. ¿Qué te gustaría mejorar?','Explica una dificultad concreta.',[
  option('o1','goal','A veces…','A veces sé lo que quiero decir, pero traduzco mentalmente y pierdo naturalidad.',['a veces','pero','naturalidad'],'n2','¿Has probado preparar solo las ideas clave?')]),
 node('n2','Raúl','Quizá te ayude preparar palabras clave, no frases completas.','Reacciona y adapta la sugerencia.',[
  option('o1','adapt','Sí, podría…','Sí, podría anotar dos o tres palabras clave y después intentar expresarlo con mis propias palabras.',['podría','palabras clave','propias palabras'],'n3','Exacto. Así entrenas la producción real.')]),
 node('n3','Raúl','¿Quieres probarlo esta semana?','Acepta y fija una meta.',[
  option('o1','commit','Voy a…','Voy a preparar un comentario de menos de cuarenta segundos usando solo palabras clave.',['voy a','comentario','palabras clave'],'end','Muy buena meta. Luego vemos cómo fue.')])]),
scenario('b1-visita','B1','daily','Recibir a una visita','Una persona visita tu ciudad por primera vez.',['writing:future','writing:connectors'],[
 node('n1','Teresa','Solo tengo una tarde libre. ¿Qué me recomiendas ver?','Recomienda priorizando.',[
  option('o1','recommend','Si solo tienes…','Si solo tienes una tarde, empezaría por el centro histórico y luego iría al paseo junto al mar.',['si solo','empezaría','luego'],'n2','¿Se puede hacer todo caminando?')]),
 node('n2','Teresa','¿Necesito transporte?','Explica distancias y alternativa.',[
  option('o1','transport','La primera parte…','La primera parte se puede hacer caminando, pero para el paseo te conviene tomar un taxi o un autobús.',['caminando','pero','te conviene'],'n3','Perfecto. ¿Dónde cenarías?')]),
 node('n3','Teresa','¿Y para cenar?','Sugiere según preferencia.',[
  option('o1','dinner','Si te gusta…','Si te gusta el pescado, hay varios sitios buenos cerca del paseo.',['si te gusta','cerca'],'end','Genial. Ya tengo plan.')])]),

scenario('b2-negociacion','B2','work','Negociar prioridades','Dos demandas compiten por el mismo plazo.',['writing:register','writing:connectors'],[
 node('n1','Directora','Necesitamos entregar ambos informes el viernes, aunque el equipo dice que no llega.','Reformula el problema y plantea criterio.',[
  option('o1','frame','Si mantenemos…','Si mantenemos el mismo alcance en ambos informes, aumenta el riesgo de entregar dos productos incompletos. Propongo priorizar según impacto y dependencia.',['si mantenemos','riesgo','propongo','impacto'],'n2','¿Cómo aplicarías ese criterio?')]),
 node('n2','Directora','Concretamente, ¿qué priorizarías?','Defiende una prioridad con concesión.',[
  option('o1','prioritize','Priorizaría…','Priorizaría el informe que desbloquea la decisión del lunes y reduciría temporalmente el alcance del segundo, sin eliminar sus conclusiones esenciales.',['priorizaría','reduciría','sin eliminar'],'n3','¿Qué necesitas para hacerlo viable?')]),
 node('n3','Directora','¿Qué condición haría viable el plan?','Pide un acuerdo verificable.',[
  option('o1','condition','Necesitaría…','Necesitaría acordar hoy qué se considera imprescindible en cada informe y evitar cambios de alcance después de esa decisión.',['necesitaría','acordar','imprescindible','evitar'],'end','De acuerdo. Cerremos ese alcance hoy.')])]),
scenario('b2-presentacion','B2','work','Responder preguntas tras una presentación','Has terminado una presentación breve.',['writing:register','writing:style'],[
 node('n1','Asistente','Los resultados parecen buenos, pero ¿cómo sabemos que la mejora no se debe a otro factor?','Reconoce la limitación y responde con evidencia.',[
  option('o1','evidence','Es una posibilidad…','Es una posibilidad que debemos considerar. Por eso comparamos el periodo con una referencia equivalente y revisamos los factores que cambiaron al mismo tiempo.',['posibilidad','por eso','comparamos','factores'],'n2','¿Aun así queda incertidumbre?')]),
 node('n2','Asistente','Entonces, ¿podemos afirmar causalidad?','Evita una afirmación excesiva.',[
  option('o1','nuance','No afirmaría…','No afirmaría causalidad con estos datos. Diría que existe una asociación consistente que justifica una validación adicional.',['no afirmaría','asociación','validación'],'n3','¿Cuál sería el siguiente paso?')]),
 node('n3','Asistente','¿Cómo validarías la conclusión?','Propón siguiente paso.',[
  option('o1','next-step','El siguiente paso…','El siguiente paso sería repetir la medición con controles definidos de antemano y comparar si el efecto se mantiene.',['siguiente paso','controles','se mantiene'],'end','Gracias. Queda claro el límite de la conclusión.')])]),
scenario('b2-desacuerdo','B2','daily','Discrepar con matices','Conversación sobre una decisión comunitaria.',['writing:connectors','writing:register'],[
 node('n1','Nuria','Creo que deberíamos prohibir por completo los coches en el centro.','Expresa desacuerdo parcial.',[
  option('o1','nuanced','Coincido en…, aunque…','Coincido en que hay que reducir el tráfico, aunque una prohibición total podría afectar a personas con movilidad reducida o a ciertos servicios.',['coincido','aunque','podría afectar'],'n2','¿Qué alternativa propondrías?')]),
 node('n2','Nuria','¿Cómo reducirías el tráfico entonces?','Propón una solución gradual.',[
  option('o1','alternative','Empezaría por…','Empezaría por restringir el acceso en las horas de mayor congestión y reforzar el transporte público antes de ampliar la medida.',['empezaría','restringir','antes de'],'n3','Eso llevaría más tiempo.')]),
 node('n3','Nuria','¿No sería demasiado lento?','Defiende el enfoque sin cerrar el debate.',[
  option('o1','defend','Puede ser más lento…','Puede ser más lento, pero permitiría medir el efecto y corregir problemas antes de aplicar una medida irreversible.',['puede ser','pero','permitiría','antes de'],'end','Entiendo. Es un enfoque más gradual.')])]),
scenario('b2-riesgo','B2','work','Analizar un riesgo de proyecto','Una decisión rápida puede crear deuda futura.',['writing:conditionals','writing:connectors'],[
 node('n1','Responsable','Podemos saltarnos esta validación para ganar dos días.','Explica el riesgo con condición.',[
  option('o1','risk','Si omitimos…','Si omitimos la validación ahora, ganamos tiempo a corto plazo, pero podríamos trasladar errores a una fase donde corregirlos sea mucho más costoso.',['si omitimos','corto plazo','pero','costoso'],'n2','¿Cómo equilibrarías plazo y control?')]),
 node('n2','Responsable','Necesitamos alguna reducción de tiempo.','Propón control mínimo.',[
  option('o1','minimum-control','Mantendría…','Mantendría las comprobaciones críticas y reduciría solo las revisiones redundantes, dejando documentado qué se aplaza y por qué.',['mantendría','críticas','reduciría','documentado'],'n3','¿Cómo decidir qué es crítico?')]),
 node('n3','Responsable','¿Cuál sería el criterio?','Define criterio objetivo.',[
  option('o1','criterion','Consideraría…','Consideraría crítico todo fallo que pueda afectar seguridad, integridad de datos o una decisión difícil de revertir.',['crítico','seguridad','integridad','revertir'],'end','Ese criterio es defendible.')])]),
scenario('b2-cultura','B2','media','Debatir una generalización cultural','Una conversación sobre diferencias culturales.',['writing:style','writing:connectors'],[
 node('n1','Álvaro','La gente de ese país siempre es muy directa.','Cuestiona la generalización sin atacar.',[
  option('o1','challenge','Puede haber…','Puede haber estilos de comunicación más frecuentes en ciertos contextos, pero “siempre” borra diferencias personales y situaciones concretas.',['puede haber','pero','siempre','diferencias'],'n2','¿Entonces no sirven las diferencias culturales?')]),
 node('n2','Álvaro','¿No crees que la cultura influye?','Reconoce influencia sin determinismo.',[
  option('o1','balance','Sí influye…','Sí influye y puede ayudarnos a interpretar expectativas, siempre que la usemos como contexto y no como una etiqueta automática para cada persona.',['sí influye','siempre que','contexto','etiqueta'],'n3','¿Cómo actuarías al conocer a alguien?')]),
 node('n3','Álvaro','¿Qué harías en la práctica?','Formula una regla práctica.',[
  option('o1','practice','Observaría…','Observaría cómo se comunica esa persona, preguntaría cuando hubiera duda y ajustaría mi estilo según la interacción real.',['observaría','preguntaría','ajustaría'],'end','Me parece una forma prudente de verlo.')])]),
scenario('b2-conflicto','B2','work','Resolver una tensión interpersonal','Dos compañeros interpretaron de forma distinta un mensaje.',['writing:register','writing:style'],[
 node('n1','Compañera','Tu mensaje sonó como si estuvieras cuestionando mi trabajo.','Reconoce impacto sin admitir una intención que no tuviste.',[
  option('o1','repair','Entiendo que…','Entiendo que pudiera sonar así y lamento que generara esa impresión. Mi intención era aclarar el criterio, no cuestionar tu trabajo.',['entiendo','lamento','mi intención','no cuestionar'],'n2','Entonces, ¿qué necesitabas aclarar?')]),
 node('n2','Compañera','¿Qué querías saber exactamente?','Aclara la necesidad de forma neutral.',[
  option('o1','clarify','Necesitaba confirmar…','Necesitaba confirmar qué versión de los datos habíamos usado, porque encontré una diferencia entre dos fuentes.',['confirmar','porque','diferencia'],'n3','Eso sí podemos revisarlo juntos.')]),
 node('n3','Compañera','Revisémoslo juntos.','Propón una forma de evitar malentendidos futuros.',[
  option('o1','future','La próxima vez…','La próxima vez puedo explicar primero el contexto de la pregunta para que no parezca una valoración del trabajo.',['próxima vez','contexto','para que'],'end','Me parece bien. Gracias por aclararlo.')])]),
scenario('b2-congregacion','B2','congregation','Apoyar a alguien con tacto','Una persona está frustrada con su progreso en español.',['writing:register','writing:subjunctive'],[
 node('n1','Miguel','Siento que, aunque estudio, sigo bloqueándome cuando quiero comentar.','Escucha y valida sin minimizar.',[
  option('o1','empathy','Es comprensible…','Es comprensible que te frustre, sobre todo porque sabes lo que quieres decir. Que te bloquees en algunos momentos no significa que no estés avanzando.',['comprensible','que te','no significa'],'n2','¿Qué crees que podría ayudarme?')]),
 node('n2','Miguel','¿Qué harías en mi lugar?','Sugiere una práctica concreta y pequeña.',[
  option('o1','suggest','Probaría…','Probaría comentarios muy breves, con una sola idea, y repetiría el mismo tipo de estructura varias veces hasta que salga con menos esfuerzo.',['probaría','muy breves','hasta que'],'n3','Eso parece más manejable.')]),
 node('n3','Miguel','¿Me ayudas a practicar uno?','Acepta y define cómo.',[
  option('o1','support','Claro…','Claro. Tú haces primero una versión de treinta segundos y después revisamos solo un aspecto, no todo a la vez.',['claro','treinta segundos','después','un aspecto'],'end','Gracias. Así me siento menos presionado.')])]),
scenario('b2-discurso','B2','congregation','Recibir feedback sobre un discurso','Conversación posterior a un ensayo.',['writing:register','writing:style'],[
 node('n1','Sara','La idea principal se entiende, pero en la parte central hay demasiadas explicaciones seguidas.','Pide que concrete el feedback.',[
  option('o1','clarify-feedback','¿En qué parte…?','¿En qué parte concreta sentiste que la idea perdía fuerza?',['qué parte','concreta','perdía fuerza'],'n2','Justo después del segundo ejemplo: introduces tres ideas nuevas.')]),
 node('n2','Sara','Después del segundo ejemplo aparecen demasiadas ideas.','Propón una revisión.',[
  option('o1','revise','Podría…','Podría conservar solo la idea que conecta directamente con el punto principal y mover las otras dos fuera de este tramo.',['podría','solo','punto principal','otras dos'],'n3','Creo que eso daría más claridad.')]),
 node('n3','Sara','Sí, y también te daría más tiempo para la conclusión.','Integra el feedback en una acción concreta.',[
  option('o1','action','Entonces voy a…','Entonces voy a recortar esa sección, ensayar de nuevo el tiempo total y comprobar si la conclusión queda menos apresurada.',['voy a','recortar','ensayar','conclusión'],'end','Ese plan aborda exactamente el problema.')])])
];

const q=(prompt,answers,explanation)=>({prompt,answers,explanation});
const story=(id,level,topic,title,body,questions)=>({id,level,topic,title,body,questions,targetMinutes:8});
export const IMMERSION_STORIES=[
story('a1-historia-mercado','A1','shopping','Una mañana en el mercado','El sábado, Clara va al mercado con una lista pequeña. Compra tomates, pan y dos naranjas. También quiere leche, pero la tienda del mercado no tiene. Antes de volver a casa, toma un café y llama a su hermana.',[
 q('¿Qué compra Clara?',['tomates pan naranjas','tomates, pan y naranjas'],'Busca los tres productos mencionados.'),q('¿Qué producto no consigue?',['leche'],'La tienda no tiene leche.'),q('¿A quién llama?',['su hermana','hermana'],'Llama a su hermana.')]),
story('a1-historia-autobus','A1','travel','El autobús correcto','Mateo sale del hotel y quiere ir al museo. Primero toma el autobús 12, pero pregunta al conductor antes de subir. El conductor le explica que necesita el 21. Mateo espera cinco minutos, toma el autobús correcto y llega al museo a las diez.',[
 q('¿Adónde quiere ir Mateo?',['al museo','museo'],'Su destino es el museo.'),q('¿Qué autobús necesita?',['21','el 21'],'El conductor indica el 21.'),q('¿A qué hora llega?',['a las diez','diez'],'Llega a las diez.')]),
story('a1-historia-reunion','A1','congregation','Antes de la reunión','Inés llega quince minutos antes de la reunión. Saluda a una familia que todavía no conoce y se presenta. Después ayuda a una señora a encontrar un asiento. Cuando empieza la reunión, Inés ya conoce tres nombres nuevos.',[
 q('¿Cuándo llega Inés?',['quince minutos antes','15 minutos antes'],'Llega quince minutos antes.'),q('¿A quién ayuda?',['a una señora','una señora'],'Ayuda a una señora.'),q('¿Cuántos nombres nuevos conoce?',['tres','3'],'Conoce tres nombres nuevos.')]),
story('a1-historia-rutina','A1','daily','Un día sencillo','Luis se levanta a las siete, prepara el desayuno y sale de casa a las ocho. Trabaja hasta las cuatro. Por la tarde camina treinta minutos y después estudia español. A las diez apaga el teléfono y se prepara para dormir.',[
 q('¿A qué hora sale de casa?',['a las ocho','ocho'],'Sale a las ocho.'),q('¿Qué hace por la tarde?',['camina y estudia español','camina','estudia español'],'Camina y estudia español.'),q('¿Qué hace a las diez?',['apaga el teléfono','se prepara para dormir'],'Apaga el teléfono y se prepara para dormir.')]),
story('a2-historia-maleta','A2','travel','La maleta equivocada','Cuando Elena llega al hotel, descubre que ha tomado una maleta casi igual a la suya. Mira la etiqueta y ve otro nombre. Llama al aeropuerto, explica el problema y vuelve en taxi. Allí encuentra al dueño de la otra maleta, que también estaba esperando. Intercambian las maletas y ambos se ríen del error.',[
 q('¿Cómo descubre el error?',['mira la etiqueta','por la etiqueta'],'Ve otro nombre en la etiqueta.'),q('¿Cómo vuelve al aeropuerto?',['en taxi','taxi'],'Vuelve en taxi.'),q('¿Qué hacen al final?',['intercambian las maletas','se ríen'],'Intercambian las maletas y se ríen.')]),
story('a2-historia-vecinos','A2','daily','Una pequeña ayuda','Rosa oye que su vecino intenta mover una mesa pesada por la escalera. Le ofrece ayuda, pero entre los dos todavía es difícil. Rosa llama a otro vecino y los tres consiguen subir la mesa. Después toman agua en la cocina y hablan unos minutos.',[
 q('¿Qué intenta mover el vecino?',['una mesa','mesa'],'Intenta mover una mesa.'),q('¿Cuántas personas suben la mesa?',['tres','3'],'Al final son tres.'),q('¿Qué hacen después?',['toman agua y hablan','toman agua'],'Toman agua y hablan.')]),
story('a2-historia-practica','A2','congregation','Quince minutos de práctica','Después de la reunión, Laura y Daniel practican español durante quince minutos. Laura quiere hablar con más naturalidad, así que no prepara frases completas. Solo anota tres palabras clave. Su primer comentario dura casi un minuto; el segundo es más corto y suena más espontáneo.',[
 q('¿Cuánto practican?',['quince minutos','15 minutos'],'Practican quince minutos.'),q('¿Qué anota Laura?',['tres palabras clave','palabras clave'],'Solo anota tres palabras clave.'),q('¿Cómo es el segundo comentario?',['más corto y más espontáneo','más espontáneo','más corto'],'El segundo es más corto y espontáneo.')]),
story('a2-historia-lluvia','A2','travel','Cambio de plan','Una familia planea pasar la tarde en un parque, pero empieza a llover justo después de comer. En vez de volver al hotel, buscan una actividad cubierta. Encuentran un museo pequeño cerca de la estación. No estaba en el plan original, pero termina siendo una de las mejores partes del viaje.',[
 q('¿Por qué cambian el plan?',['porque llueve','empieza a llover','lluvia'],'Empieza a llover.'),q('¿Adónde van?',['a un museo','museo'],'Van a un museo pequeño.'),q('¿Cómo resulta la visita?',['una de las mejores partes del viaje','muy buena'],'Termina siendo una de las mejores partes.')]),
story('b1-historia-plazo','B1','work','Un plazo ajustado','El equipo tenía cinco días para terminar un informe, pero el tercer día descubrió que una fuente de datos contenía valores duplicados. En lugar de ocultar el problema para mantener el calendario original, comunicaron el riesgo, separaron las partes afectadas y validaron primero las conclusiones más importantes. Entregaron un día más tarde, pero con trazabilidad suficiente para explicar cada decisión.',[
 q('¿Qué problema encontraron?',['valores duplicados','datos duplicados'],'La fuente contenía valores duplicados.'),q('¿Qué priorizaron?',['las conclusiones más importantes','conclusiones importantes'],'Validaron primero las conclusiones más importantes.'),q('¿Cuál fue el coste de la decisión?',['entregaron un día más tarde','un día de retraso'],'La entrega se retrasó un día.')]),
story('b1-historia-conversacion','B1','congregation','Una idea, no una traducción','Durante varias semanas, Andrés preparaba sus comentarios escribiéndolos primero en portugués y después traduciéndolos. Aunque el resultado era correcto, al hablar se detenía cada vez que olvidaba una palabra exacta. Decidió cambiar de método: empezó a preparar una sola idea y dos expresiones clave directamente en español. Sus comentarios no se volvieron perfectos de inmediato, pero pudo recuperarse mejor cuando no encontraba una palabra.',[
 q('¿Qué hacía Andrés al principio?',['escribía en portugués y traducía','traducía del portugués'],'Preparaba primero en portugués y traducía.'),q('¿Qué cambió?',['preparó una idea y expresiones clave en español','una idea y dos expresiones clave'],'Pasó a preparar directamente en español.'),q('¿Qué mejoró primero?',['pudo recuperarse mejor','se recuperaba mejor cuando olvidaba una palabra'],'Mejoró su capacidad de seguir hablando ante un bloqueo.')]),
story('b1-historia-ciudad','B1','travel','Veinticuatro horas en una ciudad','Mónica tenía solo un día para conocer una ciudad grande. En vez de intentar visitar diez lugares, eligió tres zonas cercanas y dejó espacios libres entre ellas. Esa decisión le permitió entrar en un mercado que encontró por casualidad, conversar con una vendedora y descansar sin mirar el reloj. Al final vio menos monumentos de los previstos, pero sintió que había conocido mejor la ciudad.',[
 q('¿Qué estrategia usa Mónica?',['elige tres zonas cercanas','tres zonas cercanas','deja espacios libres'],'Reduce el número de lugares y deja margen.'),q('¿Qué encuentra por casualidad?',['un mercado','mercado'],'Encuentra un mercado.'),q('¿Por qué queda satisfecha?',['siente que conoció mejor la ciudad','conoció mejor la ciudad'],'Valora la experiencia más que la cantidad de monumentos.')]),
story('b1-historia-error','B1','work','El error visible','Durante una presentación, Samuel mostró una gráfica con una etiqueta incorrecta. Se dio cuenta cuando una persona del público hizo una pregunta. En vez de improvisar una explicación para defender la diapositiva, reconoció el error, aclaró qué dato sí era correcto y prometió enviar la versión revisada. Al día siguiente compartió la corrección junto con una nota breve sobre el cambio.',[
 q('¿Cómo descubre Samuel el error?',['por una pregunta del público','una persona hizo una pregunta'],'Una pregunta le hace notar la etiqueta incorrecta.'),q('¿Qué hace en el momento?',['reconoce el error','aclara el dato correcto'],'Reconoce el error y separa lo que sí es correcto.'),q('¿Qué hace después?',['envía la versión revisada','comparte la corrección'],'Comparte la versión corregida al día siguiente.')]),
story('b2-historia-decision','B2','work','Una decisión reversible','Un equipo discutía si debía lanzar una nueva función a todos los usuarios o esperar otro mes. La evidencia era prometedora, pero todavía limitada. Una persona propuso reformular la decisión: en lugar de elegir entre lanzar o no lanzar, podían liberar la función a un grupo pequeño, definir indicadores de salida y revisar los resultados en dos semanas. El debate cambió porque el coste de equivocarse ya no era el mismo.',[
 q('¿Qué cambia en la forma de plantear la decisión?',['proponen un lanzamiento limitado','liberar a un grupo pequeño'],'Transforman una decisión binaria en una prueba limitada.'),q('¿Qué añaden además del grupo pequeño?',['indicadores de salida','indicadores','revisión en dos semanas'],'Definen condiciones e intervalo de revisión.'),q('¿Por qué cambia el debate?',['porque el coste de equivocarse disminuye','la decisión es más reversible'],'La opción se vuelve más reversible.')]),
story('b2-historia-feedback','B2','congregation','Feedback útil','Después de ensayar un discurso, Julia pidió a dos personas que no le dijeran simplemente si había estado bien. Les pidió que identificaran un momento en que la idea principal quedara especialmente clara y otro en que se perdiera. Las respuestas coincidieron en un punto: los ejemplos eran fáciles de seguir, pero la transición hacia la conclusión era abrupta. Julia no reescribió todo; trabajó únicamente esa transición y volvió a ensayar.',[
 q('¿Qué tipo de feedback pide Julia?',['un momento claro y otro confuso','dónde estaba clara la idea y dónde se perdía'],'Pide evidencia concreta, no una valoración general.'),q('¿En qué coinciden las respuestas?',['la transición a la conclusión era abrupta','transición abrupta'],'El problema común está en la transición a la conclusión.'),q('¿Qué decide no hacer?',['no reescribe todo','no cambia todo'],'Corrige solo el punto identificado.')]),
story('b2-historia-malentendido','B2','daily','Interpretar antes de responder','Marcos recibió un mensaje muy breve de un compañero y lo interpretó como una crítica. Empezó a escribir una respuesta defensiva, pero antes de enviarla decidió preguntar qué quería decir exactamente. El compañero explicó que estaba preocupado por una fecha, no por el trabajo de Marcos. La conversación posterior duró cinco minutos; la respuesta que Marcos casi había enviado probablemente habría creado un conflicto mucho más largo.',[
 q('¿Qué interpretación inicial hace Marcos?',['piensa que es una crítica','lo interpreta como una crítica'],'Interpreta el mensaje como crítica.'),q('¿Qué hace antes de responder?',['pregunta qué quería decir','pide aclaración'],'Busca aclaración.'),q('¿Qué descubre?',['que la preocupación era la fecha','estaba preocupado por una fecha'],'El problema era el plazo, no su trabajo.')]),
story('b2-historia-aprendizaje','B2','daily','La dificultad correcta','Durante meses, Vera elegía ejercicios que podía completar casi sin equivocarse porque le daban una sensación clara de progreso. Sin embargo, al intentar mantener una conversación espontánea, seguía evitando estructuras que conocía solo de forma pasiva. Cambió su rutina: mantuvo parte del repaso fácil, pero empezó a incluir tareas donde tenía que producir una respuesta antes de verla y volver a los errores después de unos días. Su precisión diaria bajó al principio, mientras su capacidad de hablar sin preparar empezó a subir.',[
 q('¿Qué problema tenía la rutina inicial?',['era demasiado fácil','evitaba producir estructuras','solo practicaba lo que ya dominaba'],'La práctica no exigía recuperación productiva suficiente.'),q('¿Qué añade a la nueva rutina?',['producción antes de ver la respuesta','volver a los errores','recuperación activa'],'Añade recuperación activa y retorno a errores.'),q('¿Por qué baja la precisión al principio?',['porque las tareas son más difíciles','aumenta la dificultad productiva'],'La práctica se vuelve más exigente aunque más útil.')])
];

export const IMMERSION_COUNTS={scenarios:IMMERSION_SCENARIOS.length,stories:IMMERSION_STORIES.length};
export function scenariosUpTo(level='A1'){const order=['A1','A2','B1','B2'],i=Math.max(0,order.indexOf(level));return IMMERSION_SCENARIOS.filter(x=>order.indexOf(x.level)<=i)}
export function storiesUpTo(level='A1'){const order=['A1','A2','B1','B2'],i=Math.max(0,order.indexOf(level));return IMMERSION_STORIES.filter(x=>order.indexOf(x.level)<=i)}
