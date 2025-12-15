--- 
title: Mi aventura en Sway + un poco de historia sobre wayland
date: 2025-11-16 11:11 
layout: post
categories: [gestores-de-ventanas] 
---
Si has leído algo sobre mí, sabrás que llevo más de un lustro usando **i3WM** sobre Arch Linux. Para mí, ha sido el estándar, el lugar donde siempre he acabado regresando.

El problema es que soy un culo inquieto. A lo largo de estos años he intentado escapar de i3 muchas veces. He probado otros entornos, he trasteado con otros WMs, pero al final siempre terminaba volviendo. Por qué? Porque i3 es cómodo, cumple con todo lo que necesito y, sencillamente, funciona. Es esa zona de confort de la que es difícil salir cuando tienes un flujo de trabajo tan personalizado y a tu gusto, y que aun en 2025 casi 26 cumple con tus expectativas...

Pero llegó un punto en el que me aburrí. Literalmente. Le he hecho mil perrerías a i3: lo he roto, lo he reconstruido, he creado híbridos extraños mezclándolo con KDE... Llegado el momento sentí que había tocado techo. Ya no sabía qué más hacer.

Además, hay una realidad que ya no puedo ignorar: **X11 se está quedando atrás**. Quería un entorno más moderno, que se viera mejor visualmente pero manteniendo el minimalismo. Y seamos claros: **nunca me gustó Picom**. De hecho, nunca lo usé realmente... no solo porque quería algo nativo, sino porque Picom nunca terminaba de funcionar del todo bien. Quería esa modernidad de serie, sin parches ni compositores externos peleándose con el sistema.

Básicamente, buscaba "otro i3", pero actual. Algo que me obligara a empezar de cero, a migrar mis configuraciones y a asentar la cabeza en **Wayland** de una vez por todas.

Por eso elegí **Sway**.

En este artículo no solo os voy a contar mi aventura y mis conclusiones tratando de domarlo; quiero que conozcáis qué es realmente Sway y su historia, porque entender de dónde viene es clave para entender hacia dónde va el escritorio en Linux.


### El Origen: De la inspiración a Sway
Para entender qué es Sway, tienes que remontarte al rey indiscutible de X11: **i3WM**. Es rápido, sencillo y su configuración en texto plano es una delicia. Pero como ya hemos dicho, X11 tiene los días contados.

**El nacimiento de Sway en 2016** Drew DeVault inició el proyecto con una meta casi religiosa: **Sway sería i3 para Wayland**. No querían reinventar la rueda ni cambiar tus atajos de teclado. Querían que pudieras coger tu config de i3, pegarla aquí y seguir trabajando como si nada, pero en un entorno Wayland.

En 2019 lanzaron la versión 1.0, alcanzando la famosa **"Feature Parity"** (paridad de funciones) con i3. A día de hoy, el proyecto se considera "terminado". Y ojo, **terminado no significa muerto**. Significa que es estable. Que no van a romper tu configuración mañana con una actualización loca, o que no van a hacer cambios grandes ni drásticos.

**La revolución de wlroots** Pero el verdadero legado de este equipo no es solo el gestor de ventanas. Es lo que tuvieron que construir para que existiera.

En 2016, crear un compositor en Wayland desde cero era un auténtico infierno. A diferencia de X11 (donde el servidor hace el trabajo sucio), en Wayland el compositor _es_ el servidor. Tienes que gestionar tú mismo los gráficos, la seguridad, los monitores... una locura. Los desarrolladores de Sway se dieron cuenta de que no tenía sentido repetir ese código una y otra vez. Así que hicieron algo grande por la comunidad: crearon **wlroots**.

**wlroots** es una librería modular, algo así como **un motor gráfico o un framework** para crear escritorios. Imagina una biblioteca donde todos los libros difíciles (gestión de buffers, DRM, inputs) ya están escritos y organizados perfectamente. ¿Por qué importa esto? Porque **democratizó el desarrollo**. Gracias a que wlroots puso los cimientos, hoy existen **gestores** como **Hyprland, River o Wayfire**. Sway no es solo un gestor, es el "padre" técnico de casi todo el ecosistema Wayland independiente. Básicamente, si no es GNOME ni KDE, probablemente lleve **wlroots** en sus tripas.

**Una comunidad de estándares** Hay que reconocerle el mérito a la comunidad de Sway. No son los tipos más simpáticos si vas a preguntar obviedades, son gente seria y técnica, pero **han levantado esto a pulso**. Su insistencia en hacer las cosas "bien" (seguras y modulares) terminó definiendo los estándares que hoy usa todo el mundo. Tuvieron tanta fuerza que incluso **Nvidia**, una empresa que históricamente ha hecho lo que le ha dado la puta gana, se vio obligada a ceder y sumarse al estándar para no quedarse fuera.

---

### Filosofía: Dogmas, Realidades y la "Paradoja"

Sway no es solo software, se rige por una filosofía técnica muy clara que a veces choca con lo que estamos acostumbrados.

**Mantener la modularidad en un mundo cerrado** Cuando Wayland empezó a estandarizarse, la tendencia de los grandes escritorios (como GNOME o KDE) era hacerlo todo "monolítico". Es decir, el gestor de ventanas, las aplicaciones, la barra, las notificaciones... todo venía en el mismo paquete cerrado.

Sway trabajó para mantener viva la esencia de los _Window Managers_ clásicos en este nuevo entorno. Su idea es que el compositor solo debe gestionar las ventanas. Si quieres una barra, instalas `Waybar`; si quieres notificaciones, `Mako`.

Esto, que en X11 era trivial, en Wayland requirió un esfuerzo enorme. Tuvieron que impulsar protocolos estándar para que estas herramientas pudieran funcionar de forma independiente y segura. Gracias a esto, hoy puedes construir tu sistema pieza a pieza en Wayland sin estar atado a lo que decida un entorno de escritorio.

**La Paradoja de la Libertad** Aquí es donde la cosa se pone interesante. Muchos usamos Linux buscando libertad total, pero Sway aplica una **libertad modular muy estricta**.

Te deja elegir tus herramientas externas, sí, pero es inflexible en cuanto a cómo debe funcionar el núcleo del sistema. Por seguridad y estabilidad, no permiten "hacks" ni soluciones a medias. Tienes que seguir sus reglas.

Es lo que yo llamo la **Paradoja de Sway**: Tienes libertad para montar tu entorno, pero vives bajo una autoridad técnica inflexible. Es como compartir piso con un **Ingeniero obsesivo del Feng Shui**: es buena gente y todo funciona perfecto, pero si mueves el sofá un milímetro, te llama la atención porque _"estás rompiendo la armonía de la habitación"_.

**El tema de NVIDIA** Esta rigidez es la causa de los famosos problemas con NVIDIA. No es algo personal, es puramente técnico. Sway trabaja con estándares abiertos, con "planos" que todos pueden leer. NVIDIA, sin embargo, entregaba sus drivers como una **caja negra cerrada con llave** y pedía que construyeran encima a ciegas.

**El tema de NVIDIA** Esta empresa es conocida por no dar un soporte real a los usuarios: nadie sabe qué hay dentro de sus drivers porque nunca han liberado el código. Y claro, nadie puede dar soporte real a algo si no sabe cómo funciona por dentro.

Es por esto que los desarrolladores de Sway/wlroots se niegan a dar soporte nativo o un trato especial. Nvidia nunca ha querido estandarizarse ni dar ningún tipo de soporte a la comunidad Linux, y como los desarrolladores no pueden saber cómo funcionan sus drivers, intentar compatibilizarlos es **dar palos de ciego**. En su momento lo intentaron, pero finalmente se rehusaron a seguir haciéndolo porque Nvidia rompía la compatibilidad constantemente con sus actualizaciones.

Es por esto que, para arrancar Sway con estos drivers, sigues teniendo que usar el flag `--unsupported-gpu`. Aunque ahora funcione, el comando se mantiene como un recordatorio: no existe soporte nativo y, si algo se rompe, no hay garantías, ya que nadie fuera de Nvidia puede arreglarlo realmente.

---

### ¿Por qué elegir Sway?

![[sway1.png]]

Vale, ya os he soltado la chapa técnica y filosófica. Pero, ¿por qué deberías instalarlo tú hoy? Después de probarlo a fondo, estas son las razones reales:

**Solidez y Estabilidad** Sway es un gestor que hace las cosas muy bien. Todo está pensado para no dar problemas. Se siente como un sistema donde cada pieza encaja perfectamente, como si fuera un puzzle.

**Migración rapidísima desde i3** Si vienes de i3, la curva de aprendizaje es ridícula. Es muy fácil de configurar e incluso de mudar tu configuración anterior. Yo mismo, aunque tuve que limpiar algunas cosas específicas, **en cuestión de 20 minutos tenía casi todo el sistema listo**.

**Rendimiento y fluidez** Espectaculares. Ojo, Sway no trae animaciones ni florituras visuales (salvo transparencias), es austero por diseño. Pero gracias a eso y a Wayland, la respuesta es inmediata y te olvidas del _tearing_ y los cortes de pantalla de X11. El sistema simplemente vuela.

**Ligero y Minimalista** Sigue siendo fiel a la filosofía de consumir lo justo y necesario. Mantiene un consumo de recursos ridículo, lo que lo hace perfecto tanto para exprimir un PC potente como para que la batería del portátil te dure más.

**Un ecosistema preparado** Al llevar años siendo el referente de los _tiling_ en Wayland, tienes un montón de herramientas compatibles (barras, menús, scripts). No vas a tener la sensación de estar en un desierto donde no hay software para hacer las cosas básicas.

### Mi aventura y veredicto final
![[sway2.png]]
Después de toda esta chapa, toca mojarse. He estado estas últimas semanas forzándome a usar Sway como mi sistema único. He migrado mis _dotfiles_, he reescrito mis scripts para que funcionen en Wayland y me he peleado con la configuración.

Tengo que decir que **trastear con él ha sido muy divertido**. Me lo he pasado bien montando el sistema, viendo cómo responde y sintiendo esa fluidez. Se nota que va fino. Pero... ¿me quedo?

**En el PC de Sobremesa: No.** Para mi uso diario en el PC principal (donde hago mi vida, juego, programo, administro y trasteo), Sway sacrifica demasiadas cosas que hoy por hoy son fundamentales para mí. Temas como compartir pantalla en Discord sin pelearte, hacer _broadcast_ de espacios de trabajo o jugar sin complicaciones... son cosas que en Sway a veces se convierten en un dolor de cabeza. No me compensa perder esa flexibilidad a cambio de su seguridad estricta. Así que seguiré buscando mi gestor de ventanas perfecto para el "Laboratorio".

**En el Portátil: Se queda.** Aquí la historia cambia radicalmente. En el portátil, donde tengo una gráfica integrada y lo uso para trabajar, navegar y programar, **Sway es una maravilla**. Ahí sí que le saco partido a la eficiencia, al consumo ridículo de batería y al minimalismo. En este entorno, Sway es imbatible.

### ¿El fin de i3?

Sí. Aunque en el sobremesa no use Sway, tengo claro que **no hay vuelta atrás a i3**. X11 ya es historia. Esta aventura me ha servido para dar el salto definitivo a Wayland. Si vuelvo atrás en algún momento, volveré a Sway.

En algún momento, cuando tenga los códigos bien pulidos y ordenados, subiré mis **Dotfiles** y haré un artículo explicando cómo he montado todo el chiringuito, por si a alguno os sirve de base o queréis cotillear cómo lo he hecho.

Nos vemos.
