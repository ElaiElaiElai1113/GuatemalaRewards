/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Language = 'en' | 'es'

type TranslationValues = Record<string, string | number>

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (text: string, values?: TranslationValues) => string
}

const languageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
}

const spanishTranslations: Record<string, string> = {
  'Multi-business rewards platform': 'Plataforma de recompensas para múltiples negocios',
  'Earn across': 'Gana en toda',
  'the network': 'la red',
  'Earn points with participating businesses, redeem rewards across the network, and keep every purchase connected to one account.':
    'Gana puntos en negocios participantes, canjea recompensas en la red y mantén cada compra conectada a una sola cuenta.',
  'Explore Businesses': 'Explorar negocios',
  'View Rewards': 'Ver recompensas',
  'Earn Points': 'Gana puntos',
  'Collect points automatically when you buy from partner businesses.':
    'Acumula puntos automáticamente al comprar en negocios aliados.',
  'Redeem Rewards': 'Canjea recompensas',
  'Use your points for perks, reward credits, and partner offers.':
    'Usa tus puntos en beneficios, créditos de recompensa y ofertas de aliados.',
  'Grow Value': 'Aumenta el valor',
  'Get more from repeat purchases, referrals, and limited-time promotions.':
    'Obtén más valor de compras recurrentes, referidos y promociones por tiempo limitado.',
  'Create your member account and start earning points after your membership is active.':
    'Crea tu cuenta de miembro y empieza a ganar puntos cuando tu membresia este activa.',
  'WhatsApp or phone': 'WhatsApp o telefono',
  'Contact details': 'Datos de contacto',
  'Contact details required': 'Datos de contacto requeridos',
  'Add contact details': 'Agregar datos de contacto',
  'Add contact details to place order': 'Agrega datos de contacto para hacer el pedido',
  'Add contact details to renew': 'Agrega datos de contacto para renovar',
  'Add contact details to subscribe': 'Agrega datos de contacto para suscribirte',
  'Add WhatsApp or phone in your profile before earning rewards':
    'Agrega WhatsApp o telefono en tu perfil antes de ganar recompensas',
  'Add WhatsApp or phone in your profile before using membership rewards.':
    'Agrega WhatsApp o telefono en tu perfil antes de usar recompensas de membresia.',
  'Add your WhatsApp or phone first so staff can contact you about reward support.':
    'Agrega primero tu WhatsApp o telefono para que el equipo pueda ayudarte con tus recompensas.',
  'Full name, email, and WhatsApp or phone are enough to start. ID checks may be added later for extra security.':
    'Nombre completo, email y WhatsApp o telefono son suficientes para empezar. Mas adelante podemos pedir ID para mas seguridad.',
  'Keep your WhatsApp or phone updated so we can support reward use.':
    'Mantén actualizado tu WhatsApp o telefono para poder ayudarte con tus recompensas.',
  'Launch ready': 'Listo para lanzamiento',
  'Use these steps to start earning with your member QR.':
    'Usa estos pasos para empezar a ganar con tu QR de miembro.',
  'Your account is created. Sign in to use your member QR and rewards. We will use your contact details for reward updates and account support.':
    'Tu cuenta esta creada. Inicia sesion para usar tu QR de miembro y recompensas. Usaremos tus datos de contacto para avisos y soporte.',
  'Network Member': 'Miembro de la red',
  'Rewards account': 'Cuenta de recompensas',
  'Earn points, redeem rewards, and stay connected across partner businesses.':
    'Gana puntos, canjea recompensas y mantente conectado con negocios aliados.',
  'Business Overview': 'Resumen del negocio',
  'Platform Operations': 'Operaciones de plataforma',
  Guia: 'Guia',
  'Member Dashboard': 'Panel de miembro',
  'Track your points, available rewards, and activity across partner businesses.':
    'Consulta tus puntos, recompensas disponibles y actividad en negocios aliados.',
  Tier: 'Nivel',
  'Next Tier': 'Siguiente nivel',
  'points until Tier': 'puntos para el nivel',
  'Points Balance': 'Saldo de puntos',
  points: 'puntos',
  'Reward Progress': 'Progreso de recompensa',
  'points away from your next reward.': 'puntos para tu próxima recompensa.',
  'Rewards you qualify for': 'Recompensas disponibles',
  'Referral Invite': 'Invitación de referido',
  'Your referral invite was approved. Your Reward Credit has been added to your balance.':
    'Tu invitación de referido fue aprobada. El crédito de recompensa se agregó a tu saldo.',
  'Your referral invite is pending staff approval. Your Reward Credit will appear after approval.':
    'Tu invitación de referido está pendiente de aprobación. El crédito aparecerá después de aprobarse.',
  'Repeat Activity': 'Actividad recurrente',
  'Visit, scan, or order to keep your rewards activity growing.':
    'Visita, escanea o pide para seguir aumentando tu actividad de recompensas.',
  'Partner Offers': 'Ofertas de aliados',
  'Next Tier Benefit': 'Beneficio del siguiente nivel',
  'Reach the next tier and qualify for higher-value perks.':
    'Alcanza el siguiente nivel y califica para beneficios de mayor valor.',
  'Rewards Catalog': 'Catálogo de recompensas',
  'Rewards Marketplace': 'Mercado de recompensas',
  'Use points for perks, reward credits, and offers from participating businesses.':
    'Usa puntos en beneficios, créditos de recompensa y ofertas de negocios participantes.',
  'Your Points': 'Tus puntos',
  'Available Points': 'Puntos disponibles',
  'Qualification Progress': 'Progreso de calificación',
  'Points Cost': 'Costo en puntos',
  'points needed': 'puntos necesarios',
  'Need More Points': 'Faltan puntos',
  'Points After': 'Puntos después',
  'Not Enough Points': 'Puntos insuficientes',
  'Active Campaigns': 'Campañas activas',
  'Promotions that turn visits into repeat business.':
    'Promociones que convierten visitas en clientes recurrentes.',
  'Browse current offers and earn bonus points on eligible purchases.':
    'Explora ofertas actuales y gana puntos extra en compras elegibles.',
  'Earn more points with participating businesses.':
    'Gana más puntos con negocios participantes.',
  'Browse current promotions and take advantage of bonus points and special deals.':
    'Explora promociones actuales y aprovecha puntos extra y ofertas especiales.',
  'Business:': 'Negocio:',
  'All Businesses': 'Todos los negocios',
  'Partner Businesses': 'Negocios aliados',
  'Partner Map': 'Mapa de aliados',
  'Find partner businesses around Guatemala and open their products from the map.':
    'Encuentra negocios aliados en Guatemala y abre sus productos desde el mapa.',
  'On Map': 'En el mapa',
  Pinned: 'Fijados',
  Exact: 'Exacto',
  Listed: 'Listado',
  Preview: 'Vista previa',
  'Preparing your partner map.': 'Preparando tu mapa de aliados.',
  'No partner businesses yet': 'Aun no hay negocios aliados',
  'Partner businesses will appear here when they are available.':
    'Los negocios aliados apareceran aqui cuando esten disponibles.',
  Guatemala: 'Guatemala',
  'Open business': 'Abrir negocio',
  'Business Directory': 'Directorio de negocios',
  'Partners without coordinates are shown with preview pins until exact locations are added.':
    'Los aliados sin coordenadas se muestran con pines de vista previa hasta agregar ubicaciones exactas.',
  'Partner Business': 'Negocio aliado',
  'Earn Rate': 'Tasa de ganancia',
  'Map Status': 'Estado en el mapa',
  'Selected item': 'Articulo seleccionado',
  'Available Products': 'Productos disponibles',
  Choose: 'Elegir',
  'Products from this partner will appear here when they are available.':
    'Los productos de este aliado apareceran aqui cuando esten disponibles.',
  'Explore businesses': 'Explorar negocios',
  'You can review the order below or keep exploring partner businesses.':
    'Puedes revisar el pedido abajo o seguir explorando negocios aliados.',
  'Default business location': 'Ubicacion de negocio predeterminada',
  'Home Business': 'Negocio principal',
  Cart: 'Carrito',
  'Activate your member QR so staff can record purchases.':
    'Activa tu QR de miembro para que el personal pueda registrar compras.',
  'Add this app to your phone home screen for quick access to QR, business, and admin tools.':
    'Agrega esta app a la pantalla de inicio de tu telefono para abrir rapido el QR, negocio y herramientas admin.',
  'Dismiss install prompt': 'Cerrar aviso de instalacion',
  'Install app': 'Instalar app',
  'Install Guatemala Rewards': 'Instalar Guatemala Rewards',
  'If the camera is unavailable, paste the customer QR link or token here.':
    'Si la camara no esta disponible, pega aqui el enlace o token del QR del cliente.',
  'Live camera scanning is not available in this browser. Paste the QR link instead.':
    'El escaneo con camara no esta disponible en este navegador. Pega el enlace del QR.',
  'Manual fallback': 'Opcion manual',
  'Guatemala Rewards needs internet for account data, QR sale recording, rewards, and admin operations. Reconnect to continue.':
    'Guatemala Rewards necesita internet para datos de cuenta, ventas con QR, recompensas y operaciones admin. Reconectate para continuar.',
  'Member QR detected. Opening the sale form.': 'QR de miembro detectado. Abriendo formulario de venta.',
  'Member QR scanner': 'Escaner de QR de miembro',
  'On iPhone, tap Share, then Add to Home Screen to use this like an app.':
    'En iPhone, toca Compartir y luego Agregar a pantalla de inicio para usarlo como app.',
  'Open sale form': 'Abrir formulario de venta',
  'Paste QR link': 'Pegar enlace QR',
  'Paste or scan a member QR first.': 'Primero pega o escanea un QR de miembro.',
  'Point the camera at the customer member QR or upload a QR screenshot.':
    'Apunta la camara al QR de miembro del cliente o sube una captura del QR.',
  'Scan member QR': 'Escanear QR de miembro',
  'That QR is not a Guatemala Rewards member QR.': 'Ese QR no es un QR de miembro de Guatemala Rewards.',
  'Use the staff device camera, upload a screenshot, or paste the member QR link to open the sale form.':
    'Usa la camara del dispositivo del personal, sube una captura o pega el enlace del QR de miembro para abrir el formulario de venta.',
  'You are offline': 'Estas sin conexion',
  'Open the guided demo for the member QR, partner business scan, and admin follow-up flow.':
    'Abre la demo guiada para el QR de miembro, el escaneo del negocio aliado y el seguimiento admin.',
  'Open the guided demo for scanning a customer QR, recording the purchase, awarding points, and tracking commission.':
    'Abre la demo guiada para escanear el QR de un cliente, registrar la compra, otorgar puntos y rastrear comision.',
  'Open the guided demo for member review, partner setup, verification, and commission operations.':
    'Abre la demo guiada para revisar miembros, configurar aliados, verificar IDs y operar comisiones.',
  'Open walkthrough': 'Abrir guia',
  'See the admin walkthrough': 'Ver guia admin',
  'See the business walkthrough': 'Ver guia negocio',
  'See the customer walkthrough': 'Ver guia cliente',
  'Walkthrough demo': 'Demo guiada',
  'Checkout blocked': 'Pago bloqueado',
  'Every recorded QR purchase, point award, and account update in one clear timeline.':
    'Cada compra con QR, punto otorgado y actualizacion de cuenta en una linea de tiempo clara.',
  'If partner staff need to verify your member account during checkout, they can scan this QR.':
    'Si el personal aliado necesita verificar tu cuenta durante el pago, puede escanear este QR.',
  'Member QR': 'QR de miembro',
  'Needs ID check': 'Necesita verificacion de ID',
  'No real payment will be processed. This purchase creates the order and posts the matching points to your account immediately.':
    'No se procesara ningun pago real. Esta compra crea el pedido y publica los puntos correspondientes de inmediato.',
  'Partner staff scan your QR to record purchases and award points.':
    'El personal aliado escanea tu QR para registrar compras y otorgar puntos.',
  'Place order request': 'Enviar pedido',
  'Posted to your account': 'Publicado en tu cuenta',
  'Purchases placed from partner businesses will appear here together with their posted points.':
    'Las compras realizadas en negocios aliados apareceran aqui junto con sus puntos publicados.',
  'Review recorded visits, points earned, and account activity.':
    'Revisa visitas registradas, puntos ganados y actividad de cuenta.',
  'Buy gift cards': 'Comprar gift cards',
  'Use points to buy existing gift cards from partner businesses.':
    'Usa puntos para comprar gift cards existentes de negocios aliados.',
  'Scan customer member QR codes, record purchases, award points, and track commission from one workspace.':
    'Escanea QR de miembros, registra compras, otorga puntos y rastrea comisiones desde un solo espacio.',
  'Show member QR': 'Mostrar QR de miembro',
  'Show your member QR at partner businesses, earn points from recorded purchases, and track each visit in one place.':
    'Muestra tu QR en negocios aliados, gana puntos por compras registradas y consulta cada visita en un solo lugar.',
  'Show your member QR at partner businesses, earn points from rewardable purchases, then use points for partner gift cards.':
    'Muestra tu QR en negocios aliados, gana puntos por compras que califican y usa esos puntos para gift cards de aliados.',
  'Use one member QR across partner businesses and keep every recorded purchase connected to your account.':
    'Usa un solo QR de miembro en negocios aliados y conserva cada compra registrada conectada a tu cuenta.',
  'After joining, customers use their own member QR when buying from partner businesses.':
    'Despues de unirse, los clientes usan su propio QR de miembro al comprar en negocios aliados.',
  'Business attribution': 'Atribucion por negocio',
  'Business-specific entry': 'Entrada especifica del negocio',
  'Customer joins and receives their member account.':
    'El cliente se une y recibe su cuenta de miembro.',
  'Customer scans the partner business QR sticker.':
    'El cliente escanea el sticker QR del negocio aliado.',
  'Customers can understand the program and join without needing training first.':
    'Los clientes pueden entender el programa y unirse sin necesitar capacitacion primero.',
  'Customers join from the exact partner business where they scanned.':
    'Los clientes se unen desde el negocio aliado exacto donde escanearon.',
  'Each QR is tied to one business, so scans and signups can be connected to that location.':
    'Cada QR esta vinculado a un negocio, para conectar escaneos y registros con esa ubicacion.',
  'Join from a partner business QR, keep your member account connected, and earn rewards from eligible purchases.':
    'Unete desde el QR de un negocio aliado, mantén tu cuenta conectada y gana recompensas por compras elegibles.',
  'Join from real local businesses': 'Unete desde negocios locales reales',
  Learn: 'Aprender',
  'On-site conversion': 'Conversion en el local',
  'Partner staff can scan member QRs to record purchases and award rewards.':
    'El personal aliado puede escanear QRs de miembro para registrar compras y otorgar recompensas.',
  'Recorded purchases stay connected to the member account and the partner business.':
    'Las compras registradas quedan conectadas con la cuenta del miembro y el negocio aliado.',
  'Rewards stay connected to one member profile.':
    'Las recompensas quedan conectadas a un solo perfil de miembro.',
  Scan: 'Escanear',
  'Scan the QR sticker at a participating business and join from that business page.':
    'Escanea el sticker QR en un negocio participante y unete desde la pagina de ese negocio.',
  'See how it works': 'Ver como funciona',
  'Simple scan-to-join flow': 'Flujo simple de escanear para unirse',
  'Staff scan the member QR at purchase to record rewards.':
    'El personal escanea el QR de miembro al comprar para registrar recompensas.',
  'Staff-ready rewards': 'Recompensas listas para el personal',
  'The business-specific landing page explains Guatemala Rewards.':
    'La pagina especifica del negocio explica Guatemala Rewards.',
  'The sticker turns foot traffic into a rewards signup moment.':
    'El sticker convierte el trafico del local en un momento de registro a recompensas.',
  'Track partner rewards': 'Seguir recompensas de aliados',
  'Turn local spending into member rewards across the Guatemala Rewards network':
    'Convierte compras locales en recompensas para miembros dentro de la red Guatemala Rewards',
  'Use one member QR': 'Usa un solo QR de miembro',
  'Verify your ID first to activate the QR staff will scan at checkout.':
    'Verifica tu ID primero para activar el QR que el personal escaneara en el pago.',
  'View cart': 'Ver carrito',
  'View your past purchases and the points posted from each confirmed order.':
    'Revisa tus compras anteriores y los puntos publicados por cada pedido confirmado.',
  'Your points will post as soon as the purchase is confirmed.':
    'Tus puntos se publicaran cuando la compra sea confirmada.',
  'Your purchase has been made successfully and the order is now confirmed.':
    'Tu compra se realizo correctamente y el pedido esta confirmado.',
  'estimated after partner staff scan your QR at purchase':
    'estimados despues de que el personal aliado escanee tu QR en la compra',
  'points pending': 'puntos pendientes',
  'points posted': 'puntos publicados',
  'will post after checkout': 'se publicaran despues del pago',
  'Shop Businesses': 'Comprar en negocios',
  'Browse partner businesses, complete purchases, and earn points automatically.':
    'Explora negocios aliados, completa compras y gana puntos automáticamente.',
  'View your past purchases and points earned.':
    'Revisa tus compras anteriores y los puntos ganados.',
  'points earned': 'puntos ganados',
  'Activity History': 'Historial de actividad',
  'Total Points': 'Puntos totales',
  'Points Earned': 'Puntos ganados',
  'Recent points earned': 'Puntos recientes ganados',
  'Member status': 'Estado de miembro',
  'Join the rewards network to earn points, track reward credits, and redeem rewards.':
    'Únete a la red de recompensas para ganar puntos, consultar créditos y canjear recompensas.',
  'Rewards Invitation': 'Invitación de recompensas',
  'Your referral invite qualified for a reward credit.':
    'Tu invitación de referido calificó para un crédito de recompensa.',
  'Join the rewards network.': 'Únete a la red de recompensas.',
  'Create your rewards account to earn points, track reward credits, and redeem rewards.':
    'Crea tu cuenta para ganar puntos, consultar créditos y canjear recompensas.',
  'Your rewards account starts here.': 'Tu cuenta de recompensas empieza aquí.',
  'Sign up once and keep every visit connected to your points balance.':
    'Regístrate una vez y mantén cada visita conectada a tu saldo de puntos.',
  'Create Rewards Account': 'Crear cuenta de recompensas',
  'Track members, campaigns, reward credits, and fulfillment from one operations dashboard.':
    'Administra miembros, campañas, créditos de recompensa y entregas desde un solo panel.',
  'Points Issued': 'Puntos otorgados',
  'Total points awarded to customers': 'Total de puntos otorgados a clientes',
  'Points Redeemed': 'Puntos canjeados',
  'Total points spent on rewards': 'Total de puntos usados en recompensas',
  'Manage Rewards': 'Gestionar recompensas',
  Campaigns: 'Campañas',
  'Create and manage promotions that engage customers and drive repeat purchases.':
    'Crea y administra promociones que atraen clientes e impulsan compras recurrentes.',
  'Create Campaign': 'Crear campaña',
  'Edit Campaign': 'Editar campaña',
  'New Campaign': 'Nueva campaña',
  'Update Campaign': 'Actualizar campaña',
  'No campaigns yet': 'Aún no hay campañas',
  'Create your first campaign to drive repeat engagement.':
    'Crea tu primera campaña para impulsar la participación recurrente.',
  'Create First Campaign': 'Crear primera campaña',
  'Manage your business information and rewards settings.':
    'Administra la información de tu negocio y la configuración de recompensas.',
  'Rewards Program': 'Programa de recompensas',
  'Rewards Rate': 'Tasa de recompensas',
  'Customers earn rewards from every eligible purchase.':
    'Los clientes ganan recompensas por cada compra elegible.',
  'Customers earn this many points for every dollar spent.':
    'Los clientes ganan esta cantidad de puntos por cada dólar gastado.',
  'Award Points': 'Otorgar puntos',
  'Look up a customer, review their balance, and award points for in-store purchases.':
    'Busca un cliente, revisa su saldo y otorga puntos por compras en tienda.',
  'Choose a customer to preview their current balance before awarding points.':
    'Elige un cliente para ver su saldo actual antes de otorgar puntos.',
  'Points to Award': 'Puntos a otorgar',
  'Add Reward': 'Agregar recompensa',
  'Create and manage rewards customers can redeem with points.':
    'Crea y administra recompensas que los clientes pueden canjear con puntos.',
  'No rewards yet': 'Aún no hay recompensas',
  'Create your first redeemable reward for members.':
    'Crea tu primera recompensa canjeable para miembros.',
  'Create First Reward': 'Crear primera recompensa',
  'Adjust Points': 'Ajustar puntos',
  'Select a member to view the profile and update points.':
    'Selecciona un miembro para ver el perfil y actualizar puntos.',
  'Failed to adjust points.': 'No se pudieron ajustar los puntos.',
  'Points Adjustment': 'Ajuste de puntos',
  'Use a positive number to add points and a negative number to deduct them.':
    'Usa un número positivo para agregar puntos y uno negativo para descontarlos.',
  'Update Points': 'Actualizar puntos',
  'Business Revenue': 'Ingresos del negocio',
  'Browse Rewards': 'Explorar recompensas',
  'Review the details and confirm. Your points will be deducted and your reward will be ready for pick-up.':
    'Revisa los detalles y confirma. Se descontarán tus puntos y tu recompensa estará lista para recoger.',
  Language: 'Idioma',
  Loading: 'Cargando',
  'Preparing your workspace.': 'Preparando tu espacio.',
  English: 'Inglés',
  Español: 'Español',
  Menu: 'Menú',
  'Close menu': 'Cerrar menú',
  Vault: 'Bóveda',
  Promotions: 'Promociones',
  Dashboard: 'Panel',
  Shop: 'Tienda',
  History: 'Historial',
  Profile: 'Perfil',
  Player: 'Jugador',
  'Rank: Legendary': 'Rango: Legendario',
  'LVL 99 Elite': 'Nivel 99 Élite',
  Platform: 'Plataforma',
  Company: 'Empresa',
  Account: 'Cuenta',
  'About Us': 'Sobre nosotros',
  Contact: 'Contacto',
  'Store Locator': 'Buscar tiendas',
  Settings: 'Configuración',
  'Sign out': 'Cerrar sesión',
  Operations: 'Operaciones',
  'Admin Portal': 'Portal admin',
  'Business Portal': 'Portal de negocio',
  'Game Ops': 'Operaciones del juego',
  'Operations Lead': 'Líder de operaciones',
  'Mission Control': 'Centro de control',
  Products: 'Productos',
  Rewards: 'Recompensas',
  Customers: 'Clientes',
  Commander: 'Comandante',
  'Account Settings': 'Configuración de cuenta',
  'Loading workspace': 'Cargando espacio de trabajo',
  'Fetching your business portal data.': 'Obteniendo los datos de tu portal de negocio.',
  'Access Denied': 'Acceso denegado',
  'This area is for business owners only.': 'Esta área es solo para dueños de negocio.',
  'Return Home': 'Volver al inicio',
  'Business Setup Required': 'Configuración de negocio requerida',
  'Business context is still loading.': 'El contexto del negocio todavia esta cargando.',
  'This account does not have a business assigned yet.':
    'Esta cuenta aún no tiene un negocio asignado.',
  Inventory: 'Inventario',
  'Order History': 'Historial de pedidos',
  'Earn XP, complete quests, and unlock rewards across partner realms.':
    'Gana XP, completa misiones y desbloquea recompensas en negocios aliados.',
  'Sign In': 'Iniciar sesión',
  Register: 'Registrarse',
  'Rewards Game': 'Juego de recompensas',
  'Guatemala Rewards.': 'Guatemala Rewards.',
  'Play every': 'Juega en cada',
  visit: 'visita',
  'Earn XP on every purchase, unlock reward drops, and climb levels across partner businesses.':
    'Gana XP en cada compra, desbloquea recompensas y sube de nivel en negocios aliados.',
  'Start Quest': 'Comenzar misión',
  'Open Vault': 'Abrir bóveda',
  'Level Up': 'Sube de nivel',
  'Watch your XP, streaks, and progress build after each visit.':
    'Mira cómo crecen tu XP, rachas y progreso después de cada visita.',
  Unlock: 'Desbloquea',
  'Spend XP on perks, reward credits, and partner rewards.':
    'Usa XP en beneficios, créditos de recompensa y recompensas de aliados.',
  Compete: 'Compite',
  'Keep momentum with quests, referrals, and limited-time bonuses.':
    'Mantén el ritmo con misiones, referidos y bonos por tiempo limitado.',
  'Welcome Back': 'Bienvenido de nuevo',
  'Sign in to check your balance and redeem rewards.':
    'Inicia sesión para revisar tu saldo y canjear recompensas.',
  'Reset Password': 'Restablecer contraseña',
  "Enter your email and we'll send you a reset link.":
    'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
  'Email Address': 'Correo electrónico',
  'Send reset link': 'Enviar enlace',
  'Back to sign in': 'Volver a iniciar sesión',
  Password: 'Contraseña',
  'Forgot password?': '¿Olvidaste tu contraseña?',
  'Staff Role': 'Rol del personal',
  'Select a staff role': 'Selecciona un rol del personal',
  'Business Owner': 'Dueño del negocio',
  'Platform Admin': 'Administrador de plataforma',
  'Signing in...': 'Iniciando sesión...',
  'Customer login <-': 'Ingreso de cliente <-',
  'Staff login ->': 'Ingreso de personal ->',
  'Create Account': 'Crear cuenta',
  'Join the rewards program and start earning.':
    'Únete al programa de recompensas y empieza a ganar.',
  'Welcome aboard!': '¡Bienvenido!',
  'Your account request is saved. Check your email if confirmation is required, then sign in. Reward actions may stay locked until admin approval.':
    'Tu solicitud de cuenta se guardó. Revisa tu correo si se requiere confirmación, luego inicia sesión. Las acciones de recompensas pueden permanecer bloqueadas hasta la aprobación del administrador.',
  'Your account is created. Sign in, then verify your ID from your profile to unlock earning, redemption, memberships, gift cards, and QR rewards.':
    'Tu cuenta esta creada. Inicia sesion y verifica tu ID desde tu perfil para desbloquear ganancias, canjes, membresias, tarjetas de regalo y recompensas QR.',
  'Join now': 'Unete ahora',
  'Join Guatemala Rewards': 'Unete a Guatemala Rewards',
  'One membership for participating local businesses': 'Una membresia para negocios locales participantes',
  'Earn rewards every time you shop locally.': 'Gana recompensas cada vez que compras localmente.',
  'Join Guatemala Rewards to earn member value with participating local businesses, track rewards in one account, and redeem perks when you are ready.':
    'Unete a Guatemala Rewards para ganar valor de miembro con negocios locales participantes, seguir tus recompensas en una cuenta y canjear beneficios cuando estes listo.',
  'Subscribe to join': 'Suscribete para unirte',
  'Membership required': 'Membresia requerida',
  'Membership required. Earn when you shop locally.': 'Membresia requerida. Gana cuando compras localmente.',
  'Earn rewards': 'Gana recompensas',
  'every time': 'cada vez',
  'you shop locally': 'que compras localmente',
  'Join Rewards Club': 'Únete al Club de Recompensas',
  'Earn across the network': 'Gana en toda la red',
  'Shop with participating local businesses and keep eligible reward value connected to one account.':
    'Compra en negocios locales participantes y manten el valor elegible de recompensas conectado a una cuenta.',
  'Redeem member perks': 'Canjea beneficios de miembro',
  'Use rewards for offers, gift-card value, experiences, and bigger travel-style perks over time.':
    'Usa recompensas para ofertas, valor en tarjetas de regalo, experiencias y beneficios tipo viaje mas grandes con el tiempo.',
  'Verified account protection': 'Proteccion de cuenta verificada',
  'One verified member account per person helps protect reward value across the network.':
    'Una cuenta verificada por persona ayuda a proteger el valor de recompensas en toda la red.',
  'For Businesses': 'Para negocios',
  'For businesses': 'Para negocios',
  'Business Login': 'Acceso para negocios',
  'Start Onboarding': 'Iniciar onboarding',
  'Browse rewards': 'Ver recompensas',
  'Earn 20% to 100% back': 'Gana de 20% a 100% de vuelta',
  'Redeem through Guatemala Rewards': 'Canjea con Guatemala Rewards',
  'Rewards are offer-based, not cash payouts. Your verified member account keeps reward value connected to you.':
    'Las recompensas se basan en ofertas, no en pagos en efectivo. Tu cuenta verificada mantiene el valor de recompensas conectado contigo.',
  'Rewards are offer-based, not cash payouts. Businesses choose offers they can afford.':
    'Las recompensas se basan en ofertas, no en pagos en efectivo. Los negocios eligen ofertas que pueden sostener.',
  'Subscribe as a member, shop at participating businesses, and collect rewards you can redeem through Guatemala Rewards. Everyday shopping can build toward bigger perks, including travel-style rewards over time.':
    'Suscribete como miembro, compra en negocios participantes y acumula recompensas que puedes canjear con Guatemala Rewards. Tus compras diarias pueden ayudarte a conseguir beneficios mas grandes, incluso recompensas tipo viaje con el tiempo.',
  'Create your member account, activate your subscription, and keep your rewards connected in one place.':
    'Crea tu cuenta de miembro, activa tu suscripcion y manten tus recompensas conectadas en un solo lugar.',
  'Create your member account and keep your rewards connected in one place.':
    'Crea tu cuenta de miembro y mantén tus recompensas conectadas en un solo lugar.',
  'Shop at participating businesses': 'Compra en negocios participantes',
  'Spend with local businesses in the Guatemala Rewards network and earn rewards as you go.':
    'Compra en negocios locales de la red Guatemala Rewards y gana recompensas mientras avanzas.',
  'Redeem your rewards': 'Canjea tus recompensas',
  'Use your rewards for member perks and offers, with bigger travel-style rewards possible over time.':
    'Usa tus recompensas para beneficios y ofertas de miembro, con recompensas tipo viaje más grandes posibles con el tiempo.',
  'Member subscription': 'Suscripcion de miembro',
  'Start a member subscription and keep your rewards connected.':
    'Activa una suscripcion de miembro y manten tus recompensas conectadas.',
  'Join once and keep rewards, gift cards, and member activity connected.':
    'Unete una vez y manten recompensas, tarjetas de regalo y actividad de miembro conectadas.',
  'Earn at participating businesses': 'Gana en negocios participantes',
  'Participating local businesses': 'Negocios locales participantes',
  'Earn from eligible spending with businesses in the Guatemala Rewards network.':
    'Gana por compras elegibles con negocios de la red Guatemala Rewards.',
  'Shop locally and collect rewards on eligible purchases.':
    'Compra localmente y acumula recompensas en compras elegibles.',
  'Member perks and experiences': 'Beneficios y experiencias de miembro',
  'Redeem offers chosen by businesses, from everyday perks to bigger rewards over time.':
    'Canjea ofertas elegidas por negocios, desde beneficios cotidianos hasta recompensas mas grandes con el tiempo.',
  'Claim member offers through a simple rewards flow.':
    'Reclama ofertas de miembro con un flujo de recompensas simple.',
  'Verified member account': 'Cuenta de miembro verificada',
  'One account per person helps protect your reward value.':
    'Una cuenta por persona ayuda a proteger el valor de tus recompensas.',
  'Verification helps keep redemption value fair and protected for real members.':
    'La verificacion ayuda a mantener el valor de canje justo y protegido para miembros reales.',
  'Businesses control their offers': 'Los negocios controlan sus ofertas',
  'Owners choose rewards that make sense for their margins.':
    'Los dueños eligen recompensas que tienen sentido para sus márgenes.',
  'Example rewards': 'Ejemplos de recompensas',
  'Available rewards': 'Recompensas disponibles',
  'Member rewards marketplace': 'Mercado de recompensas para miembros',
  'Browse perks from the network before you join.': 'Explora beneficios de la red antes de unirte.',
  'See current member rewards, gift-card value, and partner offers. Your account must be verified before reward actions unlock.':
    'Ve recompensas actuales, valor en tarjetas de regalo y ofertas de aliados. Tu cuenta debe estar verificada antes de desbloquear acciones de recompensas.',
  'Real rewards members can browse now.': 'Recompensas reales que los miembros pueden explorar ahora.',
  'Browse current member rewards before joining. Your account must be verified before reward actions unlock.':
    'Explora recompensas actuales antes de unirte. Tu cuenta debe estar verificada antes de desbloquear acciones de recompensas.',
  'Rewards are being added.': 'Se estan agregando recompensas.',
  'New rewards are being added.': 'Se estan agregando nuevas recompensas.',
  'Participating businesses can add member perks, gift-card value, and experiences as the network grows.':
    'Los negocios participantes pueden agregar beneficios de miembro, valor en tarjetas de regalo y experiencias mientras crece la red.',
  'Check back soon for live member rewards from Guatemala Rewards.':
    'Vuelve pronto para ver recompensas reales para miembros de Guatemala Rewards.',
  'Featured member reward': 'Recompensa destacada para miembros',
  'points to redeem': 'puntos para canjear',
  'Example rewards members could unlock.': 'Ejemplos de recompensas que los miembros podrían desbloquear.',
  'These examples show how the value can feel to a member. Live offers depend on the rewards available in Guatemala Rewards.':
    'Estos ejemplos muestran cómo se puede sentir el valor para un miembro. Las ofertas reales dependen de las recompensas disponibles en Guatemala Rewards.',
  'These examples show how the value can feel to a member. Live offers depend on participating businesses and the rewards they choose to launch.':
    'Estos ejemplos muestran cómo se puede sentir el valor para un miembro. Las ofertas reales dependen de los negocios participantes y de las recompensas que decidan lanzar.',
  'Example drink reward': 'Ejemplo de recompensa de bebida',
  'Coffee or drink perk': 'Beneficio de café o bebida',
  'A member shops locally, earns rewards, and redeems for a simple cafe-style perk.':
    'Un miembro compra localmente, gana recompensas y las canjea por un beneficio simple tipo cafetería.',
  'Example food reward': 'Ejemplo de recompensa de comida',
  'Pastry or meal offer': 'Oferta de pastel o comida',
  'Everyday purchases can build toward small offers members understand right away.':
    'Las compras diarias pueden acumularse para ofertas pequeñas que los miembros entienden de inmediato.',
  'Example bigger reward': 'Ejemplo de recompensa mayor',
  'Travel-style value': 'Valor tipo viaje',
  'Consistent local spending can build toward bigger rewards over time.':
    'Comprar localmente de forma constante puede acumular valor para recompensas más grandes con el tiempo.',
  'Shop locally -> earn rewards -> redeem value': 'Compra localmente -> gana recompensas -> canjea valor',
  'How it works': 'Cómo funciona',
  'Join, shop, and redeem without learning a complicated points system.':
    'Únete, compra y canjea sin aprender un sistema complicado de puntos.',
  'Create your account, verify once, and activate your membership before reward actions unlock.':
    'Crea tu cuenta, verificate una vez y activa tu membresia antes de desbloquear acciones de recompensas.',
  'Sign up once from the website, a business QR code, or a partner link.':
    'Regístrate una vez desde el sitio web, un código QR de un negocio o un enlace de aliado.',
  'Shop and earn': 'Compra y gana',
  'Spend at participating local businesses and collect rewards on eligible purchases.':
    'Compra en negocios locales participantes y acumula recompensas en compras elegibles.',
  'Redeem rewards': 'Canjea recompensas',
  'Use your rewards through Guatemala Rewards when you are ready to claim an offer.':
    'Usa tus recompensas con Guatemala Rewards cuando estés listo para reclamar una oferta.',
  'Turn first-time customers into repeat visits with rewards you control.':
    'Convierte clientes nuevos en visitas repetidas con recompensas que tú controlas.',
  'Businesses can launch QR signup links, encourage repeat visits, let staff validate redemptions, and use the calculator to understand the real cost before choosing an offer.':
    'Los negocios pueden lanzar enlaces QR de registro, incentivar visitas repetidas, permitir que el personal valide canjes y usar la calculadora para entender el costo real antes de elegir una oferta.',
  'Book Business Demo': 'Agendar demo para negocios',
  'See calculator': 'Ver calculadora',
  'QR signup links for checkout, tables, events, and partner desks':
    'Enlaces QR de registro para caja, mesas, eventos y puntos de aliados',
  'Reward offers that give customers a clear reason to come back':
    'Ofertas de recompensa que dan a los clientes una razón clara para volver',
  'Simple staff validation when members redeem in-store':
    'Validación simple por el personal cuando los miembros canjean en tienda',
  'Cost calculator that shows the real business impact before launch':
    'Calculadora de costos que muestra el impacto real antes del lanzamiento',
  'Reward example': 'Ejemplo de recompensa',
  'Members see clear value. Businesses stay in control of cost.':
    'Los miembros ven valor claro. Los negocios mantienen control del costo.',
  'Example: when a member earns $250 in reward value, a business with 25% hard cost may only feel $62.50 in real product cost.':
    'Ejemplo: cuando un miembro gana $250 en valor de recompensa, un negocio con 25% de costo directo puede sentir solo $62.50 en costo real de producto.',
  'Why it works': 'Por qué funciona',
  'Why join': 'Por qué unirse',
  'Clear rewards, simple redemption, one member account.':
    'Recompensas claras, canje simple y una sola cuenta de miembro.',
  'Guatemala Rewards is built so members can understand the value, keep rewards organized, and redeem without a complicated points system.':
    'Guatemala Rewards está diseñado para que los miembros entiendan el valor, mantengan sus recompensas organizadas y canjeen sin un sistema complicado de puntos.',
  'Guatemala Rewards helps members understand value, keep rewards organized, and redeem perks across participating businesses.':
    'Guatemala Rewards ayuda a los miembros a entender el valor, organizar recompensas y canjear beneficios en negocios participantes.',
  'Clear value for members, controlled cost for businesses.':
    'Valor claro para miembros, costo controlado para negocios.',
  'Guatemala Rewards is built to make rewards feel valuable without forcing businesses into cash-style payouts they cannot sustain.':
    'Guatemala Rewards está diseñado para que las recompensas se sientan valiosas sin obligar a los negocios a pagos tipo efectivo que no puedan sostener.',
  'Rewards are not cash payouts': 'Las recompensas no son pagos en efectivo',
  'Rewards are member perks and offers you redeem through Guatemala Rewards.':
    'Las recompensas son beneficios y ofertas para miembros que canjeas con Guatemala Rewards.',
  'Rewards are perks, credits, gift-card value, and experiences you redeem through Guatemala Rewards.':
    'Las recompensas son beneficios, creditos, valor en tarjetas de regalo y experiencias que canjeas con Guatemala Rewards.',
  'Members see useful value, while businesses can fulfill rewards through offers and experiences.':
    'Los miembros ven valor útil, mientras los negocios pueden cumplir recompensas mediante ofertas y experiencias.',
  'Your rewards stay connected': 'Tus recompensas se mantienen conectadas',
  'Your member account keeps eligible rewards together across participating locations.':
    'Tu cuenta de miembro mantiene juntas las recompensas elegibles en ubicaciones participantes.',
  'Your member account keeps eligible value organized across participating businesses.':
    'Tu cuenta de miembro mantiene el valor elegible organizado en negocios participantes.',
  'Businesses choose what they can afford': 'Los negocios eligen lo que pueden sostener',
  'Each offer can match the business model, margins, and real product cost.':
    'Cada oferta puede ajustarse al modelo del negocio, sus márgenes y el costo real del producto.',
  'Redemptions stay simple': 'Los canjes se mantienen simples',
  'Claim a reward when you are ready and follow the redemption steps in your account.':
    'Reclama una recompensa cuando estés listo y sigue los pasos de canje en tu cuenta.',
  'Staff validation keeps redemptions simple': 'La validación del personal simplifica los canjes',
  'Members claim rewards and staff confirm them through the redemption flow.':
    'Los miembros reclaman recompensas y el personal las confirma mediante el flujo de canje.',
  'ID verification protects reward value': 'La verificación de ID protege el valor de las recompensas',
  'One verified member account per person helps protect the program for everyone.':
    'Una cuenta verificada por persona ayuda a proteger el programa para todos.',
  'ID verified': 'ID verificado',
  'Reward actions are unlocked for this member account.':
    'Las acciones de recompensas estan desbloqueadas para esta cuenta de miembro.',
  'Your ID is submitted': 'Tu ID fue enviado',
  'Reward actions stay locked until admin approval.':
    'Las acciones de recompensas permanecen bloqueadas hasta la aprobacion del administrador.',
  'ID verification needs another look': 'La verificacion de ID necesita otra revision',
  'Your submission was not approved. Update your ID details to request another review.':
    'Tu envio no fue aprobado. Actualiza los datos de tu ID para pedir otra revision.',
  'Resubmit in profile': 'Reenviar en perfil',
  'Finish ID verification': 'Termina la verificacion de ID',
  'Upload your ID in profile before earning points, redeeming rewards, issuing gift cards, or activating reward credits.':
    'Sube tu ID en el perfil antes de ganar puntos, canjear recompensas, emitir tarjetas de regalo o activar creditos de recompensa.',
  'Verify in profile': 'Verificar en perfil',
  'Verify ID': 'Verificar ID',
  'ID verification required': 'Se requiere verificacion de ID',
  Issue: 'Emitir',
  'Verify ID to place order': 'Verifica tu ID para hacer el pedido',
  'ID verification is required before placing demo orders that earn rewards.':
    'Se requiere verificacion de ID antes de hacer pedidos demo que generan recompensas.',
  'Verify ID to redeem': 'Verifica tu ID para canjear',
  'Verify ID to renew': 'Verifica tu ID para renovar',
  'Verify ID to subscribe': 'Verifica tu ID para suscribirte',
  'Demo mode - no real charge.': 'Modo demo - sin cargo real.',
  'Renew now - Demo': 'Renovar ahora - Demo',
  'Resubscribe - Demo': 'Resuscribirse - Demo',
  'Subscribe - Demo': 'Suscribirse - Demo',
  'Ready to join the rewards circle?': '¿Listo para unirte al círculo de recompensas?',
  'Ready to join Guatemala Rewards?': 'Listo para unirte a Guatemala Rewards?',
  'Create your member account, activate your subscription, browse available rewards, and keep your reward value connected in one place.':
    'Crea tu cuenta de miembro, activa tu suscripcion, explora recompensas disponibles y manten el valor de tus recompensas conectado en un solo lugar.',
  'Create your member account, activate your subscription, browse available rewards, and keep your reward value connected across the network.':
    'Crea tu cuenta de miembro, activa tu suscripcion, explora recompensas disponibles y manten tu valor de recompensas conectado en toda la red.',
  'Start as a member, explore participating businesses, or book a demo to launch rewards for your own business.':
    'Empieza como miembro, explora negocios participantes o agenda una demo para lanzar recompensas en tu propio negocio.',
  Terms: 'Terminos',
  Privacy: 'Privacidad',
  'Reward Terms': 'Terminos de recompensas',
  'Verification Policy': 'Politica de verificacion',
  Legal: 'Legal',
  'Customer trust': 'Confianza del cliente',
  'Terms of Use': 'Terminos de uso',
  'Plain-language placeholder terms for Guatemala Rewards members. These should be reviewed by a qualified legal professional before launch.':
    'Terminos provisionales en lenguaje claro para miembros de Guatemala Rewards. Deben ser revisados por un profesional legal calificado antes del lanzamiento.',
  'Member accounts': 'Cuentas de miembro',
  'Members are responsible for keeping account details accurate and secure. One member account should represent one real person.':
    'Los miembros son responsables de mantener sus datos de cuenta correctos y seguros. Una cuenta de miembro debe representar a una persona real.',
  'Rewards are offer-based': 'Las recompensas se basan en ofertas',
  'Rewards are not cash payouts. Available rewards, point costs, eligibility, and redemption steps may change as the program evolves.':
    'Las recompensas no son pagos en efectivo. Las recompensas disponibles, costos en puntos, elegibilidad y pasos de canje pueden cambiar mientras el programa evoluciona.',
  'Program access': 'Acceso al programa',
  'Reward actions may require sign-in, active account status, and completed ID verification before earning or redeeming value.':
    'Las acciones de recompensas pueden requerir inicio de sesion, cuenta activa y verificacion de ID completada antes de ganar o canjear valor.',
  'Membership subscription': 'Suscripcion de miembro',
  'Joining Guatemala Rewards requires an active paid membership subscription. Reward actions may require sign-in, active subscription status, and completed ID verification before earning or redeeming value.':
    'Unirse a Guatemala Rewards requiere una suscripcion de membresia pagada y activa. Las acciones de recompensas pueden requerir inicio de sesion, suscripcion activa y verificacion de ID completada antes de ganar o canjear valor.',
  'Privacy Policy': 'Politica de privacidad',
  'Plain-language placeholder privacy notes for Guatemala Rewards. Replace with reviewed legal copy before launch.':
    'Notas provisionales de privacidad en lenguaje claro para Guatemala Rewards. Reemplazalas con texto legal revisado antes del lanzamiento.',
  'Information we collect': 'Informacion que recopilamos',
  'The app may collect account details, contact details, activity, reward history, and ID verification submissions needed to operate the program.':
    'La app puede recopilar datos de cuenta, contacto, actividad, historial de recompensas y envios de verificacion de ID necesarios para operar el programa.',
  'How information is used': 'Como se usa la informacion',
  'Information is used to manage accounts, review verification, protect reward value, support redemptions, and improve the member experience.':
    'La informacion se usa para administrar cuentas, revisar verificaciones, proteger el valor de recompensas, apoyar canjes y mejorar la experiencia del miembro.',
  'Support contact': 'Contacto de soporte',
  'For privacy questions, members can contact support@guatemalarewards.com.':
    'Para preguntas de privacidad, los miembros pueden contactar a support@guatemalarewards.com.',
  'Plain-language placeholder reward terms explaining how Guatemala Rewards value works for members.':
    'Terminos provisionales de recompensas en lenguaje claro que explican como funciona el valor de Guatemala Rewards para miembros.',
  'No cash payout promise': 'Sin promesa de pago en efectivo',
  'Rewards represent offers, perks, credits, or experiences available through Guatemala Rewards. They are not a promise of cash payment.':
    'Las recompensas representan ofertas, beneficios, creditos o experiencias disponibles con Guatemala Rewards. No son una promesa de pago en efectivo.',
  'Reward availability': 'Disponibilidad de recompensas',
  'Rewards may have inventory, expiration, eligibility, location, point cost, or verification requirements before they can be claimed.':
    'Las recompensas pueden tener inventario, vencimiento, elegibilidad, ubicacion, costo en puntos o requisitos de verificacion antes de reclamarse.',
  'Redemption review': 'Revision de canje',
  'Some reward actions may be validated by staff or administrators to keep the program fair and prevent duplicate or invalid claims.':
    'Algunas acciones de recompensas pueden ser validadas por personal o administradores para mantener el programa justo y prevenir reclamos duplicados o invalidos.',
  'Plain-language placeholder notes about why member verification is required before reward actions unlock.':
    'Notas provisionales en lenguaje claro sobre por que se requiere verificacion de miembros antes de desbloquear acciones de recompensas.',
  'Why verification is required': 'Por que se requiere verificacion',
  'Verification helps support one member account per person and protects reward value for legitimate members.':
    'La verificacion ayuda a mantener una cuenta por persona y protege el valor de recompensas para miembros legitimos.',
  'How review works': 'Como funciona la revision',
  'Admins review submitted ID details. Reward actions may stay locked while a submission is pending or if more information is needed.':
    'Los administradores revisan los datos de ID enviados. Las acciones de recompensas pueden permanecer bloqueadas mientras una solicitud esta pendiente o si se necesita mas informacion.',
  'How ID information is used': 'Como se usa la informacion de ID',
  'ID information should be used only for member verification and account protection. Members can contact support@guatemalarewards.com with questions.':
    'La informacion de ID debe usarse solo para verificacion de miembros y proteccion de cuenta. Los miembros pueden contactar a support@guatemalarewards.com si tienen preguntas.',
  'Travel-style rewards': 'Recompensas tipo viaje',
  'can start with': 'pueden empezar con',
  'everyday spending': 'compras diarias',
  'Imagine using rewards toward travel-style perks over time by earning Rewards on things you already do. Guatemala Rewards offers a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.':
    'Imagina usar recompensas para beneficios tipo viaje con el tiempo al ganar Rewards en cosas que ya haces. Guatemala Rewards ofrece un minimo de 20% y hasta 100% en recompensas cada vez que compras en negocios de nuestra red.',
  'Browse shops': 'Ver tiendas',
  'View rewards': 'Ver recompensas',
  'Become an ambassador': 'Conviértete en embajador',
  'Featured rewards circle': 'Círculo de recompensas destacado',
  'Earn from what you already do': 'Gana con lo que ya haces',
  'The video will explain the program in a simple way, then members can explore where their everyday spending turns into Rewards.':
    'El video explicará el programa de forma simple, luego los miembros pueden explorar dónde sus compras diarias se convierten en recompensas.',
  '20% to 100% back': '20% a 100% de vuelta',
  'Earn a minimum of 20% and up to 100% in Rewards when you spend within the network.':
    'Gana un mínimo de 20% y hasta 100% en recompensas cuando compras dentro de la red.',
  'Member bonus': 'Bono de miembro',
  'Keep rewards connected across visits, referrals, and participating local businesses.':
    'Mantén tus recompensas conectadas entre visitas, referidos y negocios locales participantes.',
  'More ways to earn': 'Más formas de ganar',
  'Members will earn from everyday spending now, with lower Rewards on big purchases planned for the future.':
    'Los miembros ganarán por compras diarias ahora, con recompensas menores en compras grandes previstas para el futuro.',
  'Step back into your rewards ritual.': 'Vuelve a tu ritual de recompensas.',
  'Join the circle and start collecting delights.': 'Únete al círculo y empieza a acumular beneficios.',
  'Create your account, verify once, and activate your membership to earn points, unlock perks, and move through the circle with ease.':
    'Crea tu cuenta, verificate una vez y activa tu membresia para ganar puntos, desbloquear beneficios y avanzar por el circulo con facilidad.',
  'Join the Rewards Club': 'Únete al Club de Recompensas',
  'Reward points club': 'Club de puntos de recompensa',
  'Sign in': 'Iniciar sesión',
  '20-100% back in reward points': '20-100% de vuelta en puntos de recompensa',
  'Spend $X locally. Get 20-100% back in reward points.':
    'Gasta $X localmente. Recibe 20-100% de vuelta en puntos de recompensa.',
  'Create your account, verify once, and turn eligible purchases into reward points across participating businesses.':
    'Crea tu cuenta, verificate una vez y convierte compras elegibles en puntos de recompensa en negocios participantes.',
  'Start earning points': 'Empieza a ganar puntos',
  'Earn 20-100% back': 'Gana 20-100% de vuelta',
  'Spend at participating businesses and earn reward points based on each offer.':
    'Compra en negocios participantes y gana puntos de recompensa segun cada oferta.',
  'Every visit counts': 'Cada visita cuenta',
  'Coffee, meals, services, and local shopping can all turn into points.':
    'Cafe, comidas, servicios y compras locales pueden convertirse en puntos.',
  'Redeem locally': 'Canjea localmente',
  'Use your reward points for partner perks, credits, gift cards, and offers.':
    'Usa tus puntos de recompensa para beneficios, creditos, tarjetas de regalo y ofertas de socios.',
  'Rewards for the places you already enjoy.': 'Recompensas para los lugares que ya disfrutas.',
  'Create your account, verify once, and activate your member subscription to keep rewards connected across participating businesses.':
    'Crea tu cuenta, verificate una vez y activa tu suscripcion de miembro para mantener tus recompensas conectadas entre negocios participantes.',
  'Create account': 'Crear cuenta',
  'Collect points and credits when you shop with participating local businesses.':
    'Acumula puntos y créditos cuando compras en negocios locales participantes.',
  'Unlock perks': 'Desbloquea beneficios',
  'Find member offers, rewards, gift cards, and promotions in one place.':
    'Encuentra ofertas de miembro, recompensas, tarjetas de regalo y promociones en un solo lugar.',
  'Share invites': 'Comparte invitaciones',
  'Invite friends and track rewards as the network grows around you.':
    'Invita amigos y sigue tus recompensas mientras la red crece a tu alrededor.',
  'Welcome to the Rewards Club.': 'Bienvenido al Club de Recompensas.',
  'Go to sign in': 'Ir a iniciar sesión',
  'Member Access': 'Acceso de miembro',
  'Sign in to manage your member rewards.': 'Inicia sesion para administrar tus recompensas de miembro.',
  'Create your member account.': 'Crea tu cuenta de miembro.',
  'Private member access': 'Acceso privado de miembro',
  'Member portal': 'Portal de miembro',
  'sign in.': 'inicia sesion.',
  'create account.': 'crea cuenta.',
  'Portal': 'Portal',
  'Member Portal': 'Portal de miembro',
  'Sign in to my account': 'Iniciar sesion en mi cuenta',
  "Don't have an account?": 'No tienes cuenta?',
  'Already have an account?': 'Ya tienes cuenta?',
  'Create my account': 'Crear mi cuenta',
  'Your account is created. Sign in, then verify your ID from your profile to unlock rewards.':
    'Tu cuenta esta creada. Inicia sesion y verifica tu ID desde tu perfil para desbloquear recompensas.',
  'Upload a photo or PDF of your ID for account verification.':
    'Sube una foto o PDF de tu ID para verificar la cuenta.',
  'Create your member account': 'Crea tu cuenta de miembro',
  'Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.':
    'Crea tu cuenta primero. Una vez aprobada, tus compras elegibles pueden ganar 20-100% de vuelta como puntos de recompensa.',
  'Account created. Verification unlocks rewards.':
    'Cuenta creada. La verificacion desbloquea recompensas.',
  'Join and earn points': 'Unete y gana puntos',
  'Early adopter list': 'Lista de primeros usuarios',
  'A note before we launch.': 'Una nota antes del lanzamiento.',
  'We are building Guatemala Rewards for people who want more value from the places they already visit.':
    'Estamos creando Guatemala Rewards para personas que quieren mas valor de los lugares que ya visitan.',
  'When we start, members will be able to spend with participating local businesses and earn 20-100% back as reward points, depending on the offer.':
    'Cuando empecemos, los miembros podran comprar en negocios locales participantes y ganar 20-100% de vuelta como puntos de recompensa, segun la oferta.',
  'Join the early adopter list and we will send you the first invite when the program opens.':
    'Unete a la lista de primeros usuarios y te enviaremos la primera invitacion cuando el programa abra.',
  'Back in reward points': 'De vuelta en puntos',
  'First launch invite': 'Primera invitacion',
  'Partner perks and offers': 'Beneficios y ofertas',
  "You're on the early list.": 'Estas en la lista inicial.',
  'We saved your details. We will reach out when Guatemala Rewards is ready for early adopters.':
    'Guardamos tus datos. Te contactaremos cuando Guatemala Rewards este listo para primeros usuarios.',
  'Back to home': 'Volver al inicio',
  'Get notified': 'Recibe avisos',
  'Become an early adopter': 'Se un primer usuario',
  'Leave your email, WhatsApp, or both. We will only use this to send launch updates and early access details.':
    'Deja tu email, WhatsApp o ambos. Solo lo usaremos para enviar novedades del lanzamiento y detalles de acceso temprano.',
  Name: 'Nombre',
  'WhatsApp number': 'Numero de WhatsApp',
  'Anything we should know?': 'Algo que debamos saber?',
  Optional: 'Opcional',
  'I agree to be contacted about Guatemala Rewards launch updates and early access.':
    'Acepto que me contacten sobre novedades del lanzamiento y acceso temprano de Guatemala Rewards.',
  'Unable to join the early access list.': 'No se pudo unir a la lista de acceso temprano.',
  'Join early access': 'Unirse al acceso temprano',
  'Prefer the full member signup?': 'Prefieres el registro completo?',
  'Go to member signup': 'Ir al registro de miembro',
  'Add an email or WhatsApp number': 'Agrega un email o numero de WhatsApp',
  'Membership is subscription-based. Create your account first, then activate membership when your account is ready.':
    'La membresia funciona por suscripcion. Crea tu cuenta primero y luego activa la membresia cuando tu cuenta este lista.',
  'Why we verify members': 'Por qué verificamos a los miembros',
  'One account per person keeps rewards fair across the network.':
    'Una cuenta por persona mantiene las recompensas justas en toda la red.',
  'Verification protects reward value before members earn or redeem.':
    'La verificación protege el valor de las recompensas antes de que los miembros ganen o canjeen.',
  'Admins review submissions, and your ID is used only for verification.':
    'Los administradores revisan los envíos y tu ID se usa solo para verificación.',
  'Full name': 'Nombre completo',
  'Email address': 'Correo electrónico',
  'Verification ID number': 'Número de ID de verificación',
  'ID number': 'Número de ID',
  'Photo or PDF of ID': 'Foto o PDF del ID',
  'Used only to verify one member account per person before rewards can be earned or redeemed.':
    'Se usa solo para verificar una cuenta de miembro por persona antes de que se puedan ganar o canjear recompensas.',
  'After signup, your account may need admin approval before reward actions unlock.':
    'Después del registro, tu cuenta puede necesitar aprobación administrativa antes de desbloquear acciones de recompensas.',
  'Verify your ID to activate your member QR.':
    'Verifica tu ID para activar tu QR de miembro.',
  'Your ID is under review. Your member QR activates after approval.':
    'Tu ID esta en revision. Tu QR de miembro se activa despues de la aprobacion.',
  'Resubmit ID verification to activate your member QR.':
    'Vuelve a enviar la verificacion de ID para activar tu QR de miembro.',
  'QR locked': 'QR bloqueado',
  'Verify ID to activate QR': 'Verificar ID para activar QR',
  'Already a member?': '¿Ya eres miembro?',
  'Used by admins to verify one member account per person.':
    'Usado por administradores para verificar una cuenta de miembro por persona.',
  'Enter a valid email': 'Ingresa un correo válido',
  'Enter your email': 'Ingresa tu correo',
  'Email': 'Correo',
  'Use at least 5 characters': 'Usa al menos 5 caracteres',
  'Enter your full name': 'Ingresa tu nombre completo',
  'Enter the ID number shown on your verification document':
    'Ingresa el número de ID que aparece en tu documento de verificación',
  'Keep the ID number under 80 characters':
    'Mantén el número de ID por debajo de 80 caracteres',
  'Enter your full name to create an account.': 'Ingresa tu nombre completo para crear una cuenta.',
  'Enter the ID number shown on your verification document.':
    'Ingresa el número de ID que aparece en tu documento de verificación.',
  'Go to sign in ->': 'Ir a iniciar sesión ->',
  'Create your member account and start earning XP after your membership is active.':
    'Crea tu cuenta de miembro y empieza a ganar XP cuando tu membresia este activa.',
  'Full Name': 'Nombre completo',
  'Your name': 'Tu nombre',
  'Creating account...': 'Creando cuenta...',
  'Check your email for a password reset link.':
    'Revisa tu correo para ver el enlace de restablecimiento.',
  'Unable to send reset link.': 'No se pudo enviar el enlace.',
  'Unable to sign in.': 'No se pudo iniciar sesión.',
  'Enter a valid email address and password to sign in.':
    'Ingresa un correo válido y una contraseña para iniciar sesión.',
  'Unable to create the account.': 'No se pudo crear la cuenta.',
  'Partner Realms': 'Negocios aliados',
  'Shop Realms': 'Tiendas aliadas',
  'Browse partner businesses, complete purchases, and earn XP automatically.':
    'Explora negocios aliados, completa compras y gana XP automáticamente.',
  'Item Type:': 'Tipo:',
  All: 'Todo',
  Drinks: 'Bebidas',
  Bites: 'Bocadillos',
  Gear: 'Artículos',
  Tools: 'Herramientas',
  Drink: 'Bebida',
  Pastry: 'Pastelería',
  Merch: 'Mercancía',
  Experience: 'Experiencia',
  Coffee: 'Café',
  Equipment: 'Equipo',
  'No products found matching your filters.': 'No se encontraron productos con esos filtros.',
  Realm: 'Aliado',
  'Realm:': 'Aliado:',
  'All Realms': 'Todos los aliados',
  'Bonus Drop': 'Bono especial',
  'Cash Price': 'Precio',
  'in stock': 'disponibles',
  'Adding...': 'Agregando...',
  'Add to Cart': 'Agregar al carrito',
  'Reward Vault': 'Bóveda de recompensas',
  'Loot Vault': 'Bóveda de premios',
  'Spend XP on unlocked perks, rare drops, and partner rewards.':
    'Usa XP en beneficios desbloqueados, premios especiales y recompensas de aliados.',
  'Your XP': 'Tu XP',
  'Available XP': 'XP disponible',
  'Redeem reward': 'Canjear recompensa',
  'Confirm the reward details, choose a pickup window, and submit.':
    'Confirma los detalles, elige un horario de recogida y envía.',
  Legendary: 'Legendario',
  Epic: 'Épico',
  Rare: 'Raro',
  Common: 'Común',
  'Sold Out': 'Agotado',
  Claim: 'Canjear',
  'Almost There': 'Casi listo',
  Locked: 'Bloqueado',
  'Unlock Meter': 'Progreso',
  'XP Cost': 'Costo en XP',
  'XP to unlock': 'XP para desbloquear',
  left: 'restantes',
  'Active Quests': 'Misiones activas',
  'Bonus quests that make every visit count.': 'Misiones extra para que cada visita cuente.',
  'Check out the latest missions and earn bonus XP on your purchases.':
    'Revisa las misiones más recientes y gana XP extra en tus compras.',
  'Active Quest Board': 'Tablero de misiones activas',
  'Earn more XP with every visit.': 'Gana más XP con cada visita.',
  'Browse current promotions and take advantage of bonus XP and special deals.':
    'Explora promociones actuales y aprovecha XP extra y ofertas especiales.',
  Expires: 'Vence',
  'Player Dashboard': 'Panel del jugador',
  Level: 'Nivel',
  'Welcome back,': 'Bienvenido,',
  Member: 'Miembro',
  'Complete visits, stack XP, unlock rewards, and keep your streak alive.':
    'Completa visitas, acumula XP, desbloquea recompensas y mantén tu racha.',
  'Next Level': 'Siguiente nivel',
  'until Level': 'hasta el nivel',
  'Open Reward Vault': 'Abrir bóveda',
  'XP Balance': 'Saldo de XP',
  'Reward Quest Progress': 'Progreso de recompensa',
  Just: 'Solo',
  'away from your next reward.': 'para tu próxima recompensa.',
  'Reward Credits': 'Créditos de recompensa',
  'Instant perks ready': 'Beneficios listos',
  'Generating...': 'Generando...',
  'Use Reward Credit': 'Usar crédito de recompensa',
  Unlocked: 'Desbloqueadas',
  'Rewards in your vault': 'Recompensas en tu bóveda',
  'Party Invite': 'Invitación',
  'Quest Invitation': 'Invitación de misión',
  'Your party invite unlocked a reward credit.':
    'Tu invitación desbloqueó un crédito de recompensa.',
  'Join the rewards quest.': 'Únete a la misión de recompensas.',
  'Create your rewards account and, after the invite is approved, both you and your friend get a reward credit.':
    'Crea tu cuenta de recompensas y, cuando se apruebe la invitación, tú y tu amigo recibirán un crédito de recompensa.',
  'Create your rewards account to earn XP, track reward credits, and unlock rewards.':
    'Crea tu cuenta de recompensas para ganar XP, llevar el control de créditos de recompensa y desbloquear recompensas.',
  'Two reward credits, one party invite.':
    'Dos créditos de recompensa, una invitación.',
  'Your first quest starts here.': 'Tu primera misión empieza aquí.',
  'Your reward credit appears after your signup is reviewed.':
    'Tu crédito de recompensa aparecerá cuando se revise tu registro.',
  'Sign up once and keep every visit connected to your XP balance.':
    'Regístrate una vez y mantén cada visita conectada a tu saldo de XP.',
  'Ready to claim the invitation?': '¿Listo para reclamar la invitación?',
  'Ready to start earning?': '¿Listo para empezar a ganar?',
  'Claim Reward Credit': 'Reclamar crédito de recompensa',
  'Create your account to claim the invite.':
    'Crea tu cuenta para reclamar la invitación.',
  'Create your rewards account.': 'Crea tu cuenta de recompensas.',
  'After staff approves the invite, both you and your friend receive a reward credit.':
    'Cuando el personal apruebe la invitación, tú y tu amigo recibirán un crédito de recompensa.',
  'Join the loyalty program to earn XP, track reward credits, and redeem rewards.':
    'Únete al programa de fidelidad para ganar XP, llevar el control de créditos de recompensa y canjear recompensas.',
  'Already have an account? Sign in': '¿Ya tienes una cuenta? Inicia sesión',
  'Your invite status is pending. Staff will review it before reward credits are added.':
    'Tu invitación está pendiente. El personal la revisará antes de agregar los créditos de recompensa.',
  'Use a new email address to claim this referral offer.':
    'Usa un correo nuevo para reclamar esta oferta de referido.',
  'Share this QR to give a friend and yourself a reward credit.':
    'Comparte este QR para darte a ti y a un amigo un crédito de recompensa.',
  'Copy referral link': 'Copiar enlace de referido',
  'Referral link copied.': 'Enlace de referido copiado.',
  'Redeem Reward Credit': 'Canjear crédito de recompensa',
  'Show this code to staff': 'Muestra este código al personal',
  'This code expires 15 minutes after it is generated.':
    'Este código vence 15 minutos después de generarse.',
  Referral: 'Referido',
  approved: 'aprobado',
  rejected: 'rechazado',
  pending: 'pendiente',
  'Your party invite was approved. Your Reward Credit has been added to your balance.':
    'Tu invitación fue aprobada. Tu crédito de recompensa se agregó a tu saldo.',
  'This referral was not approved. Ask staff if you think this needs another look.':
    'Este referido no fue aprobado. Consulta al personal si crees que debe revisarse.',
  'Your party invite is pending staff approval. Your Reward Credit will appear after approval.':
    'Tu invitación está pendiente de aprobación. Tu crédito de recompensa aparecerá después de aprobarse.',
  'Daily Streak': 'Racha diaria',
  'Visit, scan, or order to keep momentum and earn faster.':
    'Visita, escanea o pide para mantener el ritmo y ganar más rápido.',
  'Side Quest': 'Misión secundaria',
  'Try a new partner business to discover more reward options.':
    'Prueba un nuevo negocio aliado para descubrir más recompensas.',
  'Boss Reward': 'Recompensa mayor',
  'Reach the next tier and unlock higher-value perks.':
    'Alcanza el siguiente nivel y desbloquea beneficios de mayor valor.',
  Featured: 'Destacadas',
  'Featured Rewards': 'Recompensas destacadas',
  'Full Catalog': 'Catálogo completo',
  'Limited Time': 'Tiempo limitado',
  Activity: 'Actividad',
  'Recent Activity': 'Actividad reciente',
  'Shopping Cart': 'Carrito',
  'Your Cart': 'Tu carrito',
  'Your cart is empty.': 'Tu carrito está vacío.',
  'Browse Products': 'Ver productos',
  'Order Summary': 'Resumen del pedido',
  Subtotal: 'Subtotal',
  Tax: 'Impuesto',
  Total: 'Total',
  'earned from this order': 'ganados con este pedido',
  'Proceed to Checkout': 'Ir a pagar',
  Checkout: 'Pagar',
  'Payment Method': 'Método de pago',
  'Card Type': 'Tipo de tarjeta',
  'Card Number': 'Número de tarjeta',
  Expiry: 'Vencimiento',
  CVC: 'CVC',
  'Order failed.': 'El pedido falló.',
  'Placing Order...': 'Realizando pedido...',
  Pay: 'Pagar',
  'will be earned': 'se ganarán',
  each: 'cada uno',
  Date: 'Fecha',
  'Signature Velvet Latte': 'Latte Velvet especial',
  'Redeem any handcrafted latte with your choice of milk and syrup.':
    'Canjea cualquier latte artesanal con la leche y el jarabe que prefieras.',
  'Cold Brew Flight': 'Degustación de cold brew',
  'Sample three seasonal cold brew profiles in one curated tasting.':
    'Prueba tres perfiles de cold brew de temporada en una degustación curada.',
  'Butter Croissant Pairing': 'Maridaje de croissant de mantequilla',
  'Fresh-baked croissant paired with any small brewed coffee.':
    'Croissant recién horneado acompañado de cualquier café pequeño.',
  'Velvet Brew Tote': 'Bolsa Velvet Brew',
  'Canvas tote with embossed logo and internal bottle sleeve.':
    'Bolsa de lona con logo en relieve y compartimento interno para botella.',
  'Mystic Matcha Latte': 'Latte de matcha Mystic',
  'Ceremonial-grade matcha whisked with your choice of milk.':
    'Matcha de grado ceremonial batido con la leche que prefieras.',
  'Almond Croissant': 'Croissant de almendra',
  'Flaky croissant filled with almond cream and topped with sliced almonds.':
    'Croissant hojaldrado relleno de crema de almendra y cubierto con almendras laminadas.',
  'Afternoon Tea Set': 'Set de té de la tarde',
  'Pot of premium herbal tea served with a selection of three mini pastries.':
    'Tetera de infusión premium servida con tres mini pasteles.',
  'Oat Milk Latte': 'Latte con leche de avena',
  'Our signature oat milk latte with house-made vanilla syrup.':
    'Nuestro latte de avena especial con jarabe de vainilla hecho en casa.',
  'Cold Brew Concentrate 32oz': 'Concentrado de cold brew 32 oz',
  'Take home our 24-hour cold brew concentrate. Dilute to taste.':
    'Lleva a casa nuestro concentrado de cold brew de 24 horas. Diluye al gusto.',
  'Pistachio Cardamom Bun': 'Pan de pistacho y cardamomo',
  'Flaky laminated pastry with pistachio frangipane and cardamom glaze.':
    'Masa laminada hojaldrada con frangipane de pistacho y glaseado de cardamomo.',
  'Single Origin: Ethiopia Yirgacheffe': 'Origen único: Etiopía Yirgacheffe',
  '12oz bag of light-roasted whole beans with floral and citrus notes.':
    'Bolsa de 12 oz de granos enteros de tueste ligero con notas florales y cítricas.',
  'Velvet Brew Ceramic Tumbler': 'Vaso cerámico Velvet Brew',
  '16oz double-walled ceramic tumbler in matte black with silicone lid.':
    'Vaso cerámico de doble pared de 16 oz en negro mate con tapa de silicona.',
  'Pour-Over Starter Kit': 'Kit inicial para pour-over',
  'Ceramic dripper, 100 filters, and a 12oz sample roast.':
    'Gotero cerámico, 100 filtros y una muestra de café tostado de 12 oz.',
  'Chai Spice Latte': 'Latte chai especiado',
  'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.':
    'Chai de la casa con canela, cardamomo, jengibre y leche vaporizada.',
  'Mystic Breakfast Sandwich': 'Sándwich de desayuno Mystic',
  'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.':
    'Huevos revueltos, gruyere, rúcula y alioli de trufa en brioche.',
  'Lavender Honey Scone': 'Scone de lavanda y miel',
  'Buttery scone with dried lavender and a honey glaze drizzle.':
    'Scone mantequilloso con lavanda seca y glaseado de miel.',
  'Premium Tea Sampler': 'Muestrario de tés premium',
  'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.':
    'Set de 4 infusiones de hoja suelta: manzanilla, menta, hibisco y lavanda.',
  'Mystic Coffee Mug': 'Taza de café Mystic',
  'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.':
    'Taza cerámica hecha a mano con motivo de montaña mística. Capacidad de 12 oz.',
  'Double points after 3 PM': 'Puntos dobles después de las 3 PM',
  'Stop by after 3 PM and earn twice the points on any handcrafted drink.':
    'Visítanos después de las 3 PM y gana el doble de puntos en cualquier bebida artesanal.',
  'Weekday perk': 'Beneficio entre semana',
  'Drop by after work': 'Pasa después del trabajo',
  'All members': 'Todos los miembros',
  'Spring pairing menu': 'Menú de maridaje de primavera',
  'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.':
    'Desbloquea 120 puntos extra al combinar un pan de pistacho con cualquier espresso frío.',
  Seasonal: 'Temporada',
  'Try the pairing': 'Prueba el maridaje',
  'Bring-a-friend Saturdays': 'Sábados de traer a un amigo',
  'Invite a friend to scan your code in-store and both of you receive a surprise bonus.':
    'Invita a un amigo a escanear tu código en tienda y ambos reciben un bono sorpresa.',
  'Share your code': 'Comparte tu código',
  'Tea Tuesday Bonus': 'Bono de martes de té',
  'Order any tea on Tuesdays and earn triple points all day.':
    'Pide cualquier té los martes y gana puntos triples todo el día.',
  Weekly: 'Semanal',
  'View teas': 'Ver tés',
  'Brunch Bundle': 'Combo de brunch',
  'Get a free pastry when you order any breakfast sandwich before 11 AM.':
    'Recibe un pastel gratis al pedir cualquier sándwich de desayuno antes de las 11 AM.',
  Weekend: 'Fin de semana',
  'See menu': 'Ver menú',
  'Morning purchase': 'Compra de la mañana',
  'Oat milk latte and cardamom bun at Valencia St.':
    'Latte de avena y pan de cardamomo en Valencia St.',
  'Promo bonus': 'Bono de promoción',
  'Double points from the afternoon handcrafted drink campaign.':
    'Puntos dobles de la campaña de bebidas artesanales de la tarde.',
  'Reward redeemed': 'Recompensa canjeada',
  'Free butter croissant pairing picked up in-store.':
    'Maridaje gratis de croissant de mantequilla recogido en tienda.',
  'Staff training visit': 'Visita de capacitación del personal',
  'Cortado and tasting notes session.': 'Cortado y sesión de notas de cata.',
  'Reward Credit used': 'Crédito de recompensa usado',
  'Quest History': 'Historial de misiones',
  'Your Timeline': 'Tu cronología',
  'Every visit, bonus, and reward claim in one clear timeline.':
    'Cada visita, bono y canje de recompensa en una cronología clara.',
  'Loyalty Status': 'Estado de fidelidad',
  'Total XP': 'XP total',
  Visits: 'Visitas',
  'Total recorded visits': 'Total de visitas registradas',
  'XP Earned': 'XP ganado',
  'Recent XP earned': 'XP reciente ganado',
  Redemptions: 'Canjes',
  'Rewards redeemed': 'Recompensas canjeadas',
  Timeline: 'Cronología',
  'Most Recent First': 'Más reciente primero',
  'Your Orders': 'Tus pedidos',
  'View your past purchases and XP earned.':
    'Revisa tus compras anteriores y el XP ganado.',
  'No orders yet.': 'Aún no hay pedidos.',
  'Start Shopping': 'Empezar a comprar',
  'XP earned': 'XP ganado',
  Processing: 'Procesando',
  Posted: 'Publicado',
  'Order not found.': 'Pedido no encontrado.',
  'Continue Shopping': 'Seguir comprando',
  'Order Confirmed': 'Pedido confirmado',
  'Thank you!': '¡Gracias!',
  'Your order has been placed successfully.':
    'Tu pedido se realizó correctamente.',
  'Order Details': 'Detalles del pedido',
  'Processing - available within 24 hours':
    'Procesando - disponible dentro de 24 horas',
  'View Orders': 'Ver pedidos',
  'Redeem Reward': 'Canjear recompensa',
  'Confirm your next treat.': 'Confirma tu próximo premio.',
  'Review the details and confirm. Your XP will be deducted and your reward will be ready for pick-up.':
    'Revisa los detalles y confirma. Se descontará tu XP y tu recompensa estará lista para recoger.',
  'Return to Catalog': 'Volver al catálogo',
  Available: 'Disponibles',
  'XP After': 'XP después',
  'Pickup window': 'Horario de recogida',
  Notes: 'Notas',
  'Pickup notes, substitutions, or timing...':
    'Notas de recogida, sustituciones u horario...',
  'Processing...': 'Procesando...',
  'Redeem Now': 'Canjear ahora',
  'Not Enough XP': 'XP insuficiente',
  'Your Profile': 'Tu perfil',
  'Keep your details and preferences up to date.':
    'Mantén tus datos y preferencias actualizados.',
  'Status level': 'Nivel de estado',
  Active: 'Activo',
  'Member Status': 'Estado de miembro',
  'Quick Info': 'Información rápida',
  'Contact Details': 'Datos de contacto',
  Phone: 'Teléfono',
  'For order coordination': 'Para coordinar pedidos',
  Location: 'Ubicación',
  'Default shop location': 'Tienda predeterminada',
  Preferences: 'Preferencias',
  'Edit Profile': 'Editar perfil',
  'Phone Number': 'Número de teléfono',
  'Home Shop': 'Tienda principal',
  'Favorite Order': 'Pedido favorito',
  'Your favorite drink...': 'Tu bebida favorita...',
  'This helps staff prepare your order.':
    'Esto ayuda al personal a preparar tu pedido.',
  'Saving...': 'Guardando...',
  'Save Changes': 'Guardar cambios',
  'Signup Portal': 'Portal de registro',
  'Display this portal at checkout or on signage. New customers scan it, create an account, and appear below as pending invites before their reward credit is added.':
    'Muestra este portal en caja o en letreros. Los nuevos clientes lo escanean, crean una cuenta y aparecen abajo como invitaciones pendientes antes de agregar su crédito de recompensa.',
  'Signup QR link unavailable': 'Enlace QR de registro no disponible',
  'Signup QR link copied': 'Enlace QR de registro copiado',
  Copied: 'Copiado',
  'Copy Portal Link': 'Copiar enlace del portal',
  'signup portal': 'portal de registro',
  'Approve the invite below to grant the reward credit.':
    'Aprueba la invitación de abajo para otorgar el crédito de recompensa.',
  'Reward Credit Scanner': 'Escáner de crédito de recompensa',
  "Enter the customer's 6-digit reward credit code":
    'Ingresa el código de crédito de recompensa de 6 dígitos del cliente',
  'Redemption code': 'Código de canje',
  'Scanning...': 'Escaneando...',
  'Validate Reward Credit': 'Validar crédito de recompensa',
  'Pending Invites': 'Invitaciones pendientes',
  'Review new customer reward credit invites':
    'Revisa las invitaciones de crédito de recompensa de nuevos clientes',
  'View and manage your product catalog and inventory.':
    'Consulta y administra tu catálogo de productos e inventario.',
  'Add Product': 'Agregar producto',
  'Edit Product': 'Editar producto',
  'New Product': 'Nuevo producto',
  Title: 'Título',
  Description: 'Descripción',
  Category: 'Categoría',
  'Select a category': 'Selecciona una categoría',
  'Price ($)': 'Precio ($)',
  Highlight: 'Destacar',
  Cancel: 'Cancelar',
  'Update Product': 'Actualizar producto',
  'No products yet': 'Aún no hay productos',
  'Products added via the admin portal will appear here.':
    'Los productos agregados desde el portal admin aparecerán aquí.',
  'Are you sure you want to delete this product?':
    '¿Seguro que quieres eliminar este producto?',
  'Action failed.': 'La acción falló.',
  'Create and manage vault rewards your customers can unlock with XP.':
    'Crea y administra recompensas que tus clientes pueden desbloquear con XP.',
  'Add Vault Reward': 'Agregar recompensa',
  'Edit Reward': 'Editar recompensa',
  'New Reward': 'Nueva recompensa',
  Specialty: 'Especialidad',
  'Update Reward': 'Actualizar recompensa',
  'No vault rewards yet': 'Aún no hay recompensas',
  'Create your first unlockable reward for members.':
    'Crea tu primera recompensa desbloqueable para miembros.',
  'Create First Vault Reward': 'Crear primera recompensa',
  'Are you sure you want to delete this reward?':
    '¿Seguro que quieres eliminar esta recompensa?',
  Quests: 'Misiones',
  'Create and manage bonus quests to engage and reward your customers.':
    'Crea y administra misiones extra para atraer y recompensar a tus clientes.',
  'Create Quest': 'Crear misión',
  'Edit Quest': 'Editar misión',
  'New Quest': 'Nueva misión',
  'Badge Label': 'Etiqueta',
  'Call to Action': 'Llamado a la acción',
  Audience: 'Audiencia',
  'Update Quest': 'Actualizar misión',
  'No quests yet': 'Aún no hay misiones',
  'Create your first bonus quest to drive engagement.':
    'Crea tu primera misión extra para impulsar la participación.',
  'Create First Quest': 'Crear primera misión',
  Expired: 'Vencida',
  'Are you sure you want to delete this promotion?':
    '¿Seguro que quieres eliminar esta promoción?',
  'Look up a customer, review their balance, and award XP for in-store purchases.':
    'Busca un cliente, revisa su saldo y otorga XP por compras en tienda.',
  'active customers': 'clientes activos',
  'Quick Action': 'Acción rápida',
  'Award XP': 'Otorgar XP',
  'Failed to award points.': 'No se pudieron otorgar puntos.',
  Customer: 'Cliente',
  'Search by customer ID': 'Buscar por ID de cliente',
  'Search members': 'Buscar miembros',
  'Search customers': 'Buscar clientes',
  'Search products': 'Buscar productos',
  'Search rewards': 'Buscar recompensas',
  'Search campaigns': 'Buscar campanas',
  'Search partners': 'Buscar aliados',
  'Search contacts': 'Buscar contactos',
  'Search leads': 'Buscar prospectos',
  'Search referrals': 'Buscar referidos',
  'Search credits': 'Buscar creditos',
  'Filter members by verification status': 'Filtrar miembros por estado de verificacion',
  'Filter customers by verification status': 'Filtrar clientes por estado de verificacion',
  'Filter partners by status': 'Filtrar aliados por estado',
  Approved: 'Aprobado',
  Rejected: 'Rechazado',
  'Missing ID': 'Falta ID',
  'Active only': 'Solo activos',
  'Inactive only': 'Solo inactivos',
  'Missing coordinates': 'Faltan coordenadas',
  'Missing owner': 'Sin propietario',
  'No customers match this search': 'Ningun cliente coincide con esta busqueda',
  'No products match this search': 'Ningun producto coincide con esta busqueda',
  'No rewards match this search': 'Ninguna recompensa coincide con esta busqueda',
  'No campaigns match this search': 'Ninguna campana coincide con esta busqueda',
  'No partners match this search': 'Ningun aliado coincide con esta busqueda',
  'No contacts match this search': 'Ningun contacto coincide con esta busqueda',
  'No leads match this search': 'Ningun prospecto coincide con esta busqueda',
  'No referrals match this search': 'Ningun referido coincide con esta busqueda',
  'No credits match this search': 'Ningun credito coincide con esta busqueda',
  'Try a name, email, or customer ID.': 'Prueba con nombre, email o ID de cliente.',
  'Try a product title, category, or highlight.': 'Prueba con titulo, categoria o etiqueta.',
  'Try a reward title, category, or highlight.': 'Prueba con recompensa, categoria o etiqueta.',
  'Try a campaign title, badge, or audience.': 'Prueba con campana, etiqueta o audiencia.',
  'Try a partner name, owner, address, or slug.': 'Prueba con aliado, propietario, direccion o slug.',
  'Try a contact name, code, email, or note.': 'Prueba con contacto, codigo, email o nota.',
  'Try a name, email, city, or social handle.': 'Prueba con nombre, email, ciudad o usuario social.',
  'Try a customer, email, source, code, or status.': 'Prueba con cliente, email, fuente, codigo o estado.',
  'Try a referral source, credit type, or details.': 'Prueba con fuente, tipo de credito o detalles.',
  'Try a different search or status filter.': 'Prueba otra busqueda o filtro de estado.',
  'Try a different search or partner filter.': 'Prueba otra busqueda o filtro de aliado.',
  'No customer selected': 'Ningún cliente seleccionado',
  'Choose a customer to preview their current balance before awarding XP.':
    'Elige un cliente para ver su saldo actual antes de otorgar XP.',
  'XP to Award': 'XP a otorgar',
  Reason: 'Motivo',
  'e.g., In-store purchase $12.50': 'p. ej., compra en tienda $12.50',
  'Awarding...': 'Otorgando...',
  'Customer Base': 'Base de clientes',
  'Your Customers': 'Tus clientes',
  'Loading customers...': 'Cargando clientes...',
  Select: 'Seleccionar',
  'No customers yet': 'Aún no hay clientes',
  "Customers will appear here once they've purchased from your business.":
    'Los clientes aparecerán aquí cuando compren en tu negocio.',
  'Loading...': 'Cargando...',
  'Manage your business information and quest reward settings.':
    'Administra la información de tu negocio y la configuración de recompensas.',
  'Business Information': 'Información del negocio',
  Details: 'Detalles',
  'Business Name': 'Nombre del negocio',
  'Not set': 'Sin definir',
  'Quest Program': 'Programa de misiones',
  'XP Rate (XP per $1)': 'Tasa de XP (XP por $1)',
  'Customers earn this much XP for every dollar spent.':
    'Los clientes ganan esta cantidad de XP por cada dólar gastado.',
  'Tax Rate': 'Tasa de impuesto',
  'Enter as decimal (e.g., 0.0875 for 8.75%)':
    'Ingresa como decimal (p. ej., 0.0875 para 8.75%)',
  'Business Status': 'Estado del negocio',
  'Your business is currently active': 'Tu negocio está activo',
  'Your business is currently inactive': 'Tu negocio está inactivo',
  Inactive: 'Inactivo',
  'Failed to save settings. Please try again.':
    'No se pudo guardar la configuración. Inténtalo de nuevo.',
  'Settings saved!': 'Configuración guardada.',
  'Staff Authentication Required': 'Autenticación de personal requerida',
  'Admin access requires staff credentials.':
    'El acceso admin requiere credenciales de personal.',
  'Please use the staff demo credentials or sign in with a verified admin account to manage rewards, promotions, and member data.':
    'Usa las credenciales demo del personal o inicia sesión con una cuenta admin verificada para administrar recompensas, promociones y datos de miembros.',
  'Return to Home': 'Volver al inicio',
  'Operations Portal': 'Portal de operaciones',
  'Admin Dashboard': 'Panel admin',
  'Manage members, rewards, promotions, and monitor activity across the platform.':
    'Administra miembros, recompensas y promociones, y monitorea la actividad de la plataforma.',
  Partners: 'Aliados',
  Referrals: 'Referidos',
  'Member Profile': 'Perfil del miembro',
  'Adjust XP': 'Ajustar XP',
  Joined: 'Se unió',
  'Using...': 'Usando...',
  'Not provided': 'No proporcionado',
  'Member ID': 'ID de miembro',
  'Select a member to view the profile and update XP.':
    'Selecciona un miembro para ver el perfil y actualizar XP.',
  'Failed to adjust XP.': 'No se pudo ajustar XP.',
  'Please fix the highlighted member adjustment fields.':
    'Corrige los campos marcados del ajuste de miembro.',
  'Select from the customer list or paste a member id':
    'Selecciona de la lista de clientes o pega un ID de miembro',
  Selected: 'Seleccionado',
  'Current balance': 'Saldo actual',
  'XP Adjustment': 'Ajuste de XP',
  'Use a positive number to add XP and a negative number to deduct it.':
    'Usa un número positivo para agregar XP y uno negativo para descontarlo.',
  'e.g., Service recovery': 'p. ej., compensación de servicio',
  'Update XP': 'Actualizar XP',
  'Active Members': 'Miembros activos',
  'View Profile': 'Ver perfil',
  'Something went wrong': 'Algo salió mal',
  'An unexpected error occurred. Please reload the page to continue.':
    'Ocurrió un error inesperado. Recarga la página para continuar.',
  'Reload Page': 'Recargar página',
  'Command Center': 'Centro de mando',
  'Track members, quests, reward credits, and reward fulfillment from one arcade operations hub.':
    'Administra miembros, misiones, créditos de recompensa y cumplimiento de recompensas desde un solo panel.',
  'Members Recruited': 'Miembros reclutados',
  'Orders Completed': 'Pedidos completados',
  'Realm Revenue': 'Ingresos del negocio',
  'XP Issued': 'XP otorgado',
  'Total XP awarded to customers': 'Total de XP otorgado a clientes',
  'XP Redeemed': 'XP canjeado',
  'Total XP spent on rewards': 'Total de XP gastado en recompensas',
  'Command Shortcuts': 'Accesos rápidos',
  Manage: 'Gestionar',
  'Loading referrals...': 'Cargando referidos...',
  'No pending referrals.': 'No hay referidos pendientes.',
  Referrer: 'Referidor',
  'New Customer': 'Nuevo cliente',
  Approve: 'Aprobar',
  Reject: 'Rechazar',
  'Fulfillment Queue': 'Cola de cumplimiento',
  'Manage and fulfill pending reward claims':
    'Gestiona y cumple las solicitudes de recompensas pendientes.',
  'Manage Vault': 'Gestionar bóveda',
  'No redemptions yet.': 'Aún no hay canjes.',
  'Redeemed {date} at {time}': 'Canjeado el {date} a las {time}',
  Fulfill: 'Completar',
  'Download QR': 'Descargar QR',
  'QR code downloaded.': 'Código QR descargado.',
  'Unable to download QR code.': 'No se pudo descargar el código QR.',
  'Hey,': 'Hola,',
  'We are tired of watching people work hard and still struggle to pay for the lifestyle they want: vacations, financial freedom, and the extras that make life more enjoyable.':
    'Estamos cansados de ver a las personas trabajar duro y aun asi luchar para pagar el estilo de vida que desean: vacaciones, libertad financiera y esos extras que hacen la vida mas agradable.',
  'That is why we are creating Guatemala Rewards, the highest-paying rewards program. Get between 20% and 100% back on many of the purchases you already make every day.':
    'Por eso estamos creando Guatemala Rewards, el programa de recompensas que mas paga. Obten entre 20% y 100% de vuelta en muchas de las compras que ya haces cada dia.',
  'No overspending. No complications. Just real value back to help you enjoy more of what you love.':
    'Sin gastar de mas. Sin complicaciones. Solo valor real de vuelta para ayudarte a disfrutar mas de lo que amas.',
  'We are currently preparing our launch and inviting the first members before anyone else.':
    'Actualmente estamos preparando nuestro lanzamiento e invitando a los primeros miembros antes que a nadie.',
  'When we officially launch, subscribers will be the first to know and will get access to exclusive benefits, updates, and special opportunities to maximize their rewards.':
    'Cuando lancemos oficialmente, los suscriptores seran los primeros en enterarse y tendran acceso a beneficios exclusivos, novedades y oportunidades especiales para maximizar sus recompensas.',
  'We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.':
    'Estamos cansados de ver a la gente trabajar duro y aun asi luchar para pagar la vida que quiere: vacaciones, libertad y extras.',
  'That is why we are building Guatemala Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.':
    'Por eso estamos creando Guatemala Rewards: el programa de recompensas que mas paga. Gana de 20 a 100% de vuelta en casi todo lo que ya compras cada dia.',
  'No extra spending. Just real money back to help you do more of what you love.':
    'Sin gastar de mas. Solo dinero real de vuelta para ayudarte a hacer mas de lo que amas.',
  'We’re currently preparing for launch, and we’re inviting early supporters to join before anyone else.':
    'Estamos preparando el lanzamiento e invitando a los primeros miembros antes que a nadie.',
  'When we officially launch, subscribers will be the first to know — with access to exclusive benefits, updates, and early rewards opportunities.':
    'Cuando lancemos oficialmente, los suscriptores seran los primeros en saberlo y tendran acceso a beneficios exclusivos, novedades y primeras oportunidades de recompensas.',
  'Ready to earn more?': 'Listo para ganar mas?',
  'Let’s make this happen together.': 'Hagamos que esto pase juntos.',
  'Subscribe': 'Suscribirse',
  'Leave your details and we will contact you when Guatemala Rewards opens.':
    'Deja tus datos y te contactaremos cuando Guatemala Rewards abra.',
  'Instagram optional': 'Instagram opcional',
  'Email optional': 'Correo opcional',
  'Guatemala Rewards membership': 'Membresia Guatemala Rewards',
  'Turn everyday spending into member rewards across the Guatemala Rewards network':
    'Convierte tus compras diarias en recompensas para miembros dentro de la red Guatemala Rewards',
  'Join early to earn rewards from eligible purchases, access launch benefits, and keep your member value connected in one verified account.':
    'Unete temprano para ganar recompensas por compras elegibles, acceder a beneficios de lanzamiento y mantener tu valor de miembro conectado en una cuenta verificada.',
  'Join as an early subscriber': 'Unirme como suscriptor temprano',
  'See how rewards work': 'Ver como funcionan las recompensas',
  'Why people should join': 'Por que deberias unirte',
  'Guatemala Rewards is built for members who want everyday spending to create more usable value over time.':
    'Guatemala Rewards esta creado para miembros que quieren que sus compras diarias generen mas valor util con el tiempo.',
  'Earn from everyday spending': 'Gana con compras cotidianas',
  'Use purchases you already make to build reward value with participating businesses.':
    'Usa compras que ya haces para construir valor de recompensas con negocios participantes.',
  'Support participating businesses': 'Apoya negocios participantes',
  'Shop, dine, and buy services inside a growing local rewards network.':
    'Compra, come y adquiere servicios dentro de una red local de recompensas en crecimiento.',
  'Build toward bigger perks': 'Acumula para beneficios mayores',
  'Small eligible purchases can add up toward offers, experiences, and larger member benefits over time.':
    'Las pequenas compras elegibles pueden acumularse para ofertas, experiencias y beneficios mayores con el tiempo.',
  'Early benefits': 'Beneficios tempranos',
  'Early subscriber benefits': 'Beneficios para suscriptores tempranos',
  'Subscribers join before the public launch and receive early access to updates, launch offers, and first reward opportunities.':
    'Los suscriptores entran antes del lanzamiento publico y reciben acceso temprano a novedades, ofertas de lanzamiento y primeras oportunidades de recompensas.',
  'First access before public launch': 'Primer acceso antes del lanzamiento publico',
  'Early subscribers are invited in before the broader public launch.':
    'Los suscriptores tempranos son invitados antes del lanzamiento publico general.',
  'Launch updates first': 'Actualizaciones de lanzamiento primero',
  'Be among the first to hear when new businesses, rewards, and benefits go live.':
    'Se de los primeros en saber cuando nuevos negocios, recompensas y beneficios esten disponibles.',
  'Exclusive launch benefits': 'Beneficios exclusivos de lanzamiento',
  'Early subscribers can qualify for selected launch offers and member-only opportunities.':
    'Los suscriptores tempranos pueden calificar para ofertas seleccionadas de lanzamiento y oportunidades solo para miembros.',
  'Early reward opportunities': 'Primeras oportunidades de recompensas',
  'Get access to first-version reward opportunities as the network opens.':
    'Accede a las primeras oportunidades de recompensas mientras la red abre.',
  'Early subscriber summary': 'Resumen para suscriptores tempranos',
  'Rewards on eligible spending, depending on the offer.':
    'Recompensas por compras elegibles, segun la oferta.',
  'Early access before public launch': 'Acceso temprano antes del lanzamiento publico',
  'Join before the wider launch and receive first updates as the network opens.':
    'Unete antes del lanzamiento general y recibe las primeras actualizaciones mientras la red abre.',
  'Join early': 'Unirme temprano',
  'Rewards system': 'Sistema de recompensas',
  'How the rewards system works': 'Como funciona el sistema de recompensas',
  'The program connects eligible purchases to rewards that can be redeemed through the Guatemala Rewards network.':
    'El programa conecta compras elegibles con recompensas que se pueden canjear dentro de la red Guatemala Rewards.',
  Earn: 'Gana',
  Spend: 'Compra',
  Redeem: 'Canjea',
  'Create your member account and subscribe when you are ready.':
    'Crea tu cuenta de miembro y suscribete cuando estes listo.',
  'Make eligible purchases with participating businesses in the network.':
    'Haz compras elegibles con negocios participantes de la red.',
  'Earn 20% to 100% in rewards on eligible spending, depending on the offer.':
    'Gana de 20% a 100% en recompensas por compras elegibles, segun la oferta.',
  'Use rewards for available offers, gift-card value, experiences, and member perks.':
    'Usa recompensas para ofertas disponibles, valor de tarjetas de regalo, experiencias y beneficios de miembro.',
  'Rewards are program credits and offers, not automatic cash payouts.':
    'Las recompensas son creditos y ofertas del programa, no pagos automaticos en efectivo.',
  Membership: 'Membresia',
  'Membership advantages': 'Ventajas de la membresia',
  'Membership is the account layer that helps unlock, track, and protect reward value.':
    'La membresia es la capa de cuenta que ayuda a desbloquear, seguir y proteger el valor de tus recompensas.',
  'One verified account': 'Una cuenta verificada',
  'Your rewards stay connected to one member profile.':
    'Tus recompensas permanecen conectadas a un solo perfil de miembro.',
  'Member-only access': 'Acceso solo para miembros',
  'Membership unlocks earning, redemption, and selected subscriber benefits.':
    'La membresia desbloquea ganancias, canjes y beneficios seleccionados para suscriptores.',
  'Protected reward value': 'Valor de recompensas protegido',
  'Verification helps keep rewards fair and protected for real members.':
    'La verificacion ayuda a mantener las recompensas justas y protegidas para miembros reales.',
  ' by simply spending at amazing businesses within our platform':
    ' simplemente comprando en negocios increibles dentro de nuestra plataforma',
  '$10/mo flat': '$10/mes fijo',
  '$10/mo membership, $10 credit instantly': 'Membresia de $10/mes, credito de $10 al instante',
  '20% - 100%': '20% - 100%',
  '20–100% back on eligible spending': '20-100% de vuelta en compras elegibles',
  'A softer showcase for the items most likely to pull shoppers deeper into the catalog.':
    'Una vitrina mas suave para los articulos que mas pueden atraer a los compradores al catalogo.',
  'Account required.': 'Cuenta requerida.',
  'Active in wallet': 'Activo en la billetera',
  'Active promotions from participating businesses will appear here.':
    'Las promociones activas de negocios participantes apareceran aqui.',
  'Active.': 'Activo.',
  'Add items from the shop before checking out.': 'Agrega articulos de la tienda antes de pagar.',
  'Administrative changes will appear here.': 'Los cambios administrativos apareceran aqui.',
  'Attributed customers will appear here after referral links are used.':
    'Los clientes atribuidos apareceran aqui despues de usar enlaces de referido.',
  'Back to landing page': 'Volver a la pagina principal',
  Browse: 'Explorar',
  'Browse businesses': 'Explorar negocios',
  Businesses: 'Negocios',
  'Canceling...': 'Cancelando...',
  'Catalog browsing stays open. Subscribe in demo mode only when you are ready to redeem.':
    'El catalogo queda abierto. Suscribete en modo demo solo cuando estes listo para canjear.',
  Checking: 'Verificando',
  'Checking active promotions.': 'Verificando promociones activas.',
  'Checking your cart.': 'Verificando tu carrito.',
  Close: 'Cerrar',
  'Coffee dates, market finds, golden points': 'Citas de cafe, hallazgos locales, puntos dorados',
  'Confirmed order volume': 'Volumen de pedidos confirmados',
  'Create a partner business before assigning owners or reviewing metrics.':
    'Crea un negocio aliado antes de asignar duenos o revisar metricas.',
  'Create a product for the selected partner.': 'Crea un producto para el aliado seleccionado.',
  'Create a promotion for the selected partner.': 'Crea una promocion para el aliado seleccionado.',
  'Create a reward for the selected partner.': 'Crea una recompensa para el aliado seleccionado.',
  'Create an account or sign in first, then subscribe in demo mode to unlock this action.':
    'Crea una cuenta o inicia sesion primero, luego suscribete en modo demo para desbloquear esta accion.',
  'Create partner contacts to track hotel and front-desk referrals.':
    'Crea contactos aliados para rastrear referidos de hoteles y recepciones.',
  'Create reward': 'Crear recompensa',
  'Create your first product to make it available in the shop.':
    'Crea tu primer producto para que este disponible en la tienda.',
  'Create your first referral source link to start tracking referred purchases.':
    'Crea tu primer enlace de fuente de referido para empezar a rastrear compras referidas.',
  'Create your first reward to start earning loyalty.':
    'Crea tu primera recompensa para empezar a generar fidelidad.',
  'Curated Social Catalog': 'Catalogo social curado',
  'Curated pick': 'Seleccion curada',
  'Customer accounts will appear here after signup.':
    'Las cuentas de clientes apareceran aqui despues del registro.',
  'Customer referral records will appear here.': 'Los registros de referidos de clientes apareceran aqui.',
  'Customers with completed orders': 'Clientes con pedidos completados',
  'Demo Checkout': 'Pago demo',
  'Demo mode - no real charge': 'Modo demo - sin cargo real',
  'Demo mode: subscribe with no real charge to earn points and redeem rewards.':
    'Modo demo: suscribete sin cargo real para ganar puntos y canjear recompensas.',
  'Discover curated experiences, pretty little perks, and rewards worth sharing with friends.':
    'Descubre experiencias curadas, pequenos beneficios atractivos y recompensas para compartir con amigos.',
  'Dismiss membership offer': 'Cerrar oferta de membresia',
  'Early adopter monthly subscription': 'Suscripcion mensual para primeros miembros',
  'Earn between ': 'Gana entre ',
  'Earn between 20% - 100% by simply spending at amazing businesses within our platform':
    'Gana entre 20% y 100% simplemente comprando en negocios increibles dentro de nuestra plataforma',
  'Earn points at checkout and redeem rewards while active.':
    'Gana puntos al pagar y canjea recompensas mientras estes activo.',
  FAQ: 'Preguntas frecuentes',
  'Featured drops': 'Destacados',
  'Frequently asked questions': 'Preguntas frecuentes',
  Frozen: 'Congelado',
  'Get $10 credit instantly + earn rewards.': 'Recibe $10 de credito al instante y gana recompensas.',
  'Get $10 reward credit immediately after subscribing.':
    'Recibe $10 de credito de recompensa inmediatamente despues de suscribirte.',
  'Browse Gift Cards': 'Ver tarjetas de regalo',
  'Gift Cards': 'Tarjetas de regalo',
  'Gift cards from partner businesses will appear here when they are available.':
    'Las tarjetas de regalo de negocios aliados apareceran aqui cuando esten disponibles.',
  'Gift cards with this status will appear here.':
    'Las tarjetas de regalo con este estado apareceran aqui.',
  'Golden perks': 'Beneficios dorados',
  'Instant credit': 'Credito instantaneo',
  Join: 'Unirse',
  'Latest entries': 'Entradas recientes',
  'Lifetime demo order value': 'Valor total de pedidos demo',
  'Loading your order history.': 'Cargando tu historial de pedidos.',
  'Guatemala Rewards': 'Guatemala Rewards',
  'Member agreement': 'Acuerdo de miembro',
  'Member agreement applies': 'Aplica el acuerdo de miembro',
  'Member signup': 'Registro de miembro',
  Members: 'Miembros',
  'Membership unlocks redemption.': 'La membresia desbloquea el canje.',
  'Memberships are tied to your rewards balance, so guests must sign in or register before subscribing.':
    'Las membresias estan vinculadas a tu saldo de recompensas, por eso los invitados deben iniciar sesion o registrarse antes de suscribirse.',
  Mock: 'Demo',
  'Mock Membership': 'Membresia demo',
  Monthly: 'Mensual',
  'Monthly Membership': 'Membresia mensual',
  'My Gift Cards': 'Mis tarjetas de regalo',
  'Monthly price': 'Precio mensual',
  'Need a member account?': 'Necesitas una cuenta de miembro?',
  'No activity yet': 'Aun no hay actividad',
  'No admin logs yet': 'Aun no hay registros administrativos',
  'No ambassador leads yet': 'Aun no hay solicitudes de embajadores',
  'No gift cards here': 'No hay tarjetas de regalo aqui',
  'No gift cards yet': 'Aun no hay tarjetas de regalo',
  'No orders found': 'No se encontraron pedidos',
  'No orders yet': 'Aun no hay pedidos',
  'No outstanding partner credits': 'No hay creditos de aliados pendientes',
  'No partner contacts yet': 'Aun no hay contactos aliados',
  'No partner referrals yet': 'Aun no hay referidos de aliados',
  'No partners yet': 'Aun no hay aliados',
  'No promotions yet': 'Aun no hay promociones',
  'No real payment will be processed. This checkout creates a demo order for rewards testing.':
    'No se procesara ningun pago real. Este pago crea un pedido demo para probar recompensas.',
  'No redemptions yet': 'Aun no hay canjes',
  'No referral sources yet': 'Aun no hay fuentes de referido',
  'No referrals found': 'No se encontraron referidos',
  'Not active': 'No activo',
  'Not now': 'Ahora no',
  'Opening your gift card wallet.': 'Abriendo tu billetera de tarjetas de regalo.',
  'Orders matching this filter will appear here.':
    'Los pedidos que coincidan con este filtro apareceran aqui.',
  'Page not found': 'Pagina no encontrada',
  'Partner referral records will appear here after attribution.':
    'Los registros de referidos de aliados apareceran aqui despues de la atribucion.',
  Payment: 'Pago',
  'Pending Fulfillment': 'Cumplimiento pendiente',
  'Place order': 'Hacer pedido',
  'Points, redemptions, and account activity will appear here.':
    'Los puntos, canjes y actividad de cuenta apareceran aqui.',
  'Portfolio demo billing: buttons call Supabase RPCs directly and never process a real payment.':
    'Facturacion demo de portafolio: los botones llaman RPCs de Supabase directamente y nunca procesan un pago real.',
  'Portfolio demo only: no card, processor, or real charge.':
    'Solo demo de portafolio: sin tarjeta, procesador ni cargo real.',
  'Preparing available rewards.': 'Preparando recompensas disponibles.',
  'Preparing gift cards.': 'Preparando tarjetas de regalo.',
  'Preparing reward details.': 'Preparando detalles de recompensa.',
  'Preparing your catalog.': 'Preparando tu catalogo.',
  'Privacy policy': 'Politica de privacidad',
  'Products from partner businesses will appear here when they are available.':
    'Los productos de negocios aliados apareceran aqui cuando esten disponibles.',
  'Promotions currently live': 'Promociones activas actualmente',
  Provider: 'Proveedor',
  'Ready to redeem': 'Listo para canjear',
  'Ready to use': 'Listo para usar',
  'Redeemable partner credits will appear here once referrals earn credits.':
    'Los creditos canjeables de aliados apareceran aqui cuando los referidos generen creditos.',
  'Renewing...': 'Renovando...',
  Renews: 'Renueva',
  'Review recent points and redemption activity.':
    'Revisa puntos recientes y actividad de canjes.',
  'Reward claims ready for staff': 'Solicitudes de recompensa listas para el personal',
  'Reward claims will appear here when customers redeem points.':
    'Las solicitudes de recompensa apareceran aqui cuando los clientes canjeen puntos.',
  'Reward fulfillment requests will appear here.':
    'Las solicitudes de cumplimiento de recompensas apareceran aqui.',
  'Reward not found.': 'Recompensa no encontrada.',
  'Rewards from participating businesses will appear here when they are available.':
    'Las recompensas de negocios participantes apareceran aqui cuando esten disponibles.',
  'Share the ambassador link to collect creator and promoter requests.':
    'Comparte el enlace de embajadores para recopilar solicitudes de creadores y promotores.',
  'Shop products and offers from the network.': 'Compra productos y ofertas de la red.',
  'Showcase the most tempting redemptions with soft motion, warm highlights, and clear value.':
    'Muestra los canjes mas atractivos con movimiento suave, detalles calidos y valor claro.',
  'Sign in or register': 'Iniciar sesion o registrarse',
  'Sign in to your member account.': 'Inicia sesion en tu cuenta de miembro.',
  'Simulated Payment Method': 'Metodo de pago simulado',
  'Submitting...': 'Enviando...',
  'Subscribe in demo mode to start earning and redeeming while keeping the catalog open to browse.':
    'Suscribete en modo demo para empezar a ganar y canjear mientras mantienes el catalogo abierto para explorar.',
  'Subscribe in demo mode to unlock earning and redemption actions.':
    'Suscribete en modo demo para desbloquear acciones de ganar y canjear.',
  'Subscribe — Demo': 'Suscribirse - Demo',
  'Subscribing...': 'Suscribiendo...',
  'The page you are looking for does not exist or may have moved.':
    'La pagina que buscas no existe o puede haberse movido.',
  "The world's highest paying rewards program": 'El programa de recompensas que mas paga en el mundo',
  'This week feels extra golden': 'Esta semana se siente extra dorada',
  'Track your balance, rewards, and recent activity across partner businesses.':
    'Consulta tu saldo, recompensas y actividad reciente en negocios aliados.',
  'Track your rewards, gift-card value, and member activity in one verified account across the network.':
    'Consulta tus recompensas, valor de tarjetas de regalo y actividad de miembro en una cuenta verificada en toda la red.',
  'Next steps': 'Proximos pasos',
  'Finish these steps to unlock the full rewards experience.':
    'Completa estos pasos para desbloquear toda la experiencia de recompensas.',
  'Reward wallet': 'Billetera de recompensas',
  'Your member wallet': 'Tu billetera de miembro',
  'Reward credits': 'Creditos de recompensa',
  'Gift cards': 'Tarjetas de regalo',
  Claimable: 'Canjeables',
  'Catalog summary': 'Resumen del catalogo',
  'Gift card summary': 'Resumen de tarjetas de regalo',
  'Checkout summary': 'Resumen de pago',
  'Available points': 'Puntos disponibles',
  'Items in order': 'Articulos en el pedido',
  'Estimated total': 'Total estimado',
  'Estimated reward impact': 'Impacto estimado en recompensas',
  'Verification required before earning rewards':
    'Verificacion requerida antes de ganar recompensas',
  'Pick products from participating businesses before checking out.':
    'Elige productos de negocios participantes antes de pagar.',
  'Purchases and points earned after checkout will appear here.':
    'Las compras y puntos ganados despues del pago apareceran aqui.',
  'Total rewards': 'Recompensas totales',
  'Claimable rewards': 'Recompensas canjeables',
  'Active filter': 'Filtro activo',
  'Total gift cards': 'Tarjetas de regalo totales',
  'Claimable gift cards': 'Tarjetas de regalo canjeables',
  'Active business': 'Negocio activo',
  'All businesses': 'Todos los negocios',
  'Selected business': 'Negocio seleccionado',
  'No claimable rewards yet': 'Aun no hay recompensas canjeables',
  'No rewards match this filter': 'Ninguna recompensa coincide con este filtro',
  'No claimable gift cards yet': 'Aun no hay tarjetas de regalo canjeables',
  'No gift cards for this business': 'No hay tarjetas de regalo para este negocio',
  'Earn more points, verify your ID, or check back when new rewards are available.':
    'Gana mas puntos, verifica tu ID o vuelve cuando haya nuevas recompensas disponibles.',
  'Earn more points, verify your ID, or check back when new gift cards are available.':
    'Gana mas puntos, verifica tu ID o vuelve cuando haya nuevas tarjetas de regalo disponibles.',
  'Try a different category or business filter.':
    'Prueba otra categoria o filtro de negocio.',
  'Try another business or clear the business filter.':
    'Prueba otro negocio o limpia el filtro de negocio.',
  Earned: 'Ganado',
  Redeemed: 'Canjeado',
  Bonus: 'Bono',
  Adjusted: 'Ajustado',
  'Gift card issued': 'Tarjeta de regalo emitida',
  'Gift card redeemed': 'Tarjeta de regalo canjeada',
  Pending: 'Pendiente',
  'Verify ID to issue': 'Verifica tu ID para emitir',
  'Active membership': 'Membresia activa',
  'Membership inactive': 'Membresia inactiva',
  'Verify your ID to unlock rewards.': 'Verifica tu ID para desbloquear recompensas.',
  'Activate membership to use reward value.':
    'Activa la membresia para usar valor de recompensa.',
  'Your balance is ready for rewards.': 'Tu saldo esta listo para recompensas.',
  'Start earning': 'Empieza a ganar',
  'Shop with a participating business to start earning.':
    'Compra en un negocio participante para empezar a ganar.',
  'Account created': 'Cuenta creada',
  'Your member profile is ready.': 'Tu perfil de miembro esta listo.',
  'Identity approved. Reward actions are unlocked.':
    'Identidad aprobada. Las acciones de recompensas estan desbloqueadas.',
  'Under review': 'En revision',
  'View status': 'Ver estado',
  'Needs resubmission': 'Necesita reenvio',
  'Resubmit ID': 'Reenviar ID',
  'Upload your ID to unlock earning, redemption, and QR rewards.':
    'Sube tu ID para desbloquear ganancias, canjes y recompensas QR.',
  'Activate membership': 'Activar membresia',
  'Membership is active.': 'La membresia esta activa.',
  'Activate membership to earn and redeem reward value.':
    'Activa la membresia para ganar y canjear valor de recompensa.',
  Activate: 'Activar',
  'Unlock member QR': 'Desbloquear QR de miembro',
  'Member QR is active in your profile.': 'El QR de miembro esta activo en tu perfil.',
  'Your QR activates after ID approval.': 'Tu QR se activa despues de aprobar tu ID.',
  'View QR': 'Ver QR',
  'Earn first reward': 'Ganar primera recompensa',
  'You have reward activity on your account.': 'Ya tienes actividad de recompensas en tu cuenta.',
  'Shop with a participating business to earn points.':
    'Compra en un negocio participante para ganar puntos.',
  'Start shopping': 'Empezar a comprar',
  'Verification required': 'Verificacion requerida',
  Verified: 'Verificado',
  Unknown: 'Desconocido',
  'Unlock points on this order': 'Desbloquear puntos en este pedido',
  'Unlock reward redemption': 'Desbloquear canje de recompensas',
  'Unlock the treat': 'Desbloquear el beneficio',
  'Use the preset demo payment options below. They do not charge a real card.':
    'Usa las opciones de pago demo de abajo. No cobran una tarjeta real.',
  'Use your points across participating businesses.': 'Usa tus puntos en negocios participantes.',
  'View history': 'Ver historial',
  'Your cart is empty': 'Tu carrito esta vacio',
  'Your cart is invalid.': 'Tu carrito no es valido.',
  'Your current renewal date is': 'Tu fecha actual de renovacion es',
  'Your purchases and points earned will appear here.':
    'Tus compras y puntos ganados apareceran aqui.',
  customers: 'clientes',
  'reward credits available': 'creditos de recompensa disponibles',
  'your balance is safe. Resubscribe to start earning again.':
    'tu saldo esta protegido. Vuelve a suscribirte para empezar a ganar otra vez.',
  'Guatemala rewards, launched from local business QR stickers':
    'Guatemala Rewards, impulsado por codigos QR de negocios locales',
  'Scan once. Join locally.': 'Escanea una vez. Unete localmente.',
  'with Guatemala partners.': 'con aliados de Guatemala.',
  Back: 'Volver',
  'Guatemala Rewards gives each partner business its own scannable on-site entry point, so customers can learn, join, and start earning from the place they already visited.':
    'Guatemala Rewards le da a cada negocio aliado su propio punto de acceso escaneable para que los clientes conozcan el programa, se unan y empiecen a ganar desde el lugar que ya visitaron.',
  'The first launch priority is simple: clear business-specific QR pages that explain the program and turn real foot traffic into members.':
    'La prioridad inicial es sencilla: paginas QR claras para cada negocio que explican el programa y convierten las visitas reales en miembros.',
  'Each sticker opens a business-specific landing page that explains Guatemala Rewards and lets the customer join from that exact location.':
    'Cada sticker abre una pagina especifica del negocio que explica Guatemala Rewards y permite al cliente unirse desde ese lugar.',
  'Cafes, hotels & restaurants': 'Cafes, hoteles y restaurantes',
  'Local member rewards': 'Recompensas para miembros locales',
  'Business-coded QR stickers': 'Stickers QR exclusivos para negocios',
  'Built for Guatemala': 'Creado para Guatemala',
  'Actual QR examples': 'Ejemplos reales de QR',
  'One sticker code per partner business': 'Un codigo de sticker por cada negocio aliado',
  'Scans route to that business-specific Guatemala Rewards landing page.':
    'Cada escaneo abre la pagina de Guatemala Rewards de ese negocio.',
  'Scan the business sticker': 'Escanea el sticker del negocio',
  'A customer sees the black Guatemala Rewards QR sticker on-site and scans it with their phone.':
    'El cliente ve el sticker QR negro de Guatemala Rewards en el negocio y lo escanea con su telefono.',
  'Land on that business page': 'Abre la pagina de ese negocio',
  'The QR opens a page made for that exact partner, so the customer understands the program in context.':
    'El QR abre una pagina creada para ese aliado, para que el cliente entienda el programa en contexto.',
  'The customer joins from the business page and gets their own member account and scannable member QR.':
    'El cliente se une desde la pagina del negocio y obtiene su cuenta y su propio QR de miembro.',
  'Shop, scan, and earn': 'Compra, escanea y gana',
  'Partner staff scan the member QR when the customer buys, record the sale, and award rewards.':
    'El personal del aliado escanea el QR del miembro al comprar, registra la venta y entrega recompensas.',
  'What does each partner QR do?': 'Que hace el QR de cada aliado?',
  'Each QR is individually coded for one business. It opens that business-specific Guatemala Rewards landing page, so signups and interest can be tied back to the location where the customer scanned.':
    'Cada QR esta codificado para un solo negocio. Abre la pagina especifica de ese aliado para relacionar los registros con el lugar donde el cliente escaneo.',
  'Where should the QR sticker go?': 'Donde debe colocarse el sticker QR?',
  'The sticker should be easy to see where customers already pause: checkout, tables, hotel desks, menus, event booths, or partner counters.':
    'El sticker debe verse facilmente donde los clientes se detienen: caja, mesas, recepcion de hoteles, menus, eventos o mostradores.',
  'Does the customer need an app first?': 'El cliente necesita una aplicacion primero?',
  'No. The customer can scan the business QR and join from the landing page. After joining, they can use their own member QR for purchases at partner businesses.':
    'No. El cliente puede escanear el QR del negocio y registrarse desde la pagina. Luego puede usar su propio QR de miembro en los negocios aliados.',
  'How does the business flow work?': 'Como funciona el proceso para el negocio?',
  'Staff scan the customer member QR, enter the purchase amount, and the system records rewards for the member plus the commission tracking for Guatemala Rewards.':
    'El personal escanea el QR del miembro, ingresa el valor de la compra y el sistema registra las recompensas y la comision de Guatemala Rewards.',
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'es'
  return window.localStorage.getItem('guatemalarewards-language') === 'en' ? 'en' : 'es'
}

function applyValues(text: string, values?: TranslationValues) {
  if (!values) return text
  return Object.entries(values).reduce(
    (nextText, [key, value]) => nextText.replaceAll(`{${key}}`, String(value)),
    text,
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('guatemalarewards-language', language)
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (text, values) => {
        const translated = language === 'es' ? spanishTranslations[text] ?? text : text
        return applyValues(translated, values)
      },
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}

export { languageLabels, type Language }
