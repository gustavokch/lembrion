import { Translations } from '../../../types';

export const ptBR: Translations = {
  // Navigation
  dashboard: 'Painel',
  study: 'Estudar',
  history: 'Histórico',
  settings: 'Configurações',
  
  // Dashboard
  welcomeTitle: 'Bem-vindo ao Studorama',
  welcomeSubtitle: 'Sessões de estudo com IA para aprimorar seu aprendizado',
  usingModel: 'Usando modelo:',
  totalSessions: 'Total de Sessões',
  completed: 'Concluídas',
  averageScore: 'Pontuação Média',
  startNewSession: 'Iniciar Nova Sessão',
  beginNewSession: 'Iniciar uma nova sessão de estudo com IA',
  viewHistory: 'Ver Histórico',
  reviewPastSessions: 'Revisar suas sessões de estudo anteriores',
  recentSessions: 'Sessões Recentes',
  questions: 'questões',
  inProgress: 'Em Andamento',
  score: 'pontuação',
  
  // Study Session
  startNewStudySession: 'Iniciar Nova Sessão de Estudo',
  configureSession: 'Configure sua sessão de estudo com IA usando técnicas de aprendizado comprovadas',
  questionType: 'Tipo de Questão',
  multipleChoice: 'Múltipla Escolha',
  quickAssessment: 'Questões de avaliação rápida',
  dissertative: 'Dissertativa',
  deepAnalysis: 'Questões de análise profunda',
  mixed: 'Misto',
  interleavedPractice: 'Prática intercalada',
  learningTechniques: 'Técnicas de Aprendizado',
  spacedRepetitionDesc: 'Questões erradas voltam após 3 novas, até 2 vezes',
  interleavingDesc: 'Com 2 ou mais contextos, cada nova questão foca no próximo contexto, em rodízio',
  elaborativeInterrogationDesc: 'Após uma resposta errada, responda a uma pergunta "por que" sobre o tema',
  selfExplanationDesc: 'Após cada resposta, explique com suas palavras por que a resposta correta está certa',
  desirableDifficultiesDesc: 'A dificuldade sobe após 3 acertos seguidos e desce após 2 erros seguidos',
  difficulty: 'Dificuldade',
  difficultyEasy: 'Fácil',
  difficultyMedium: 'Média',
  difficultyHard: 'Difícil',
  startEnhancedSession: 'Iniciar Sessão de Estudo Aprimorada',
  generatingQuestion: 'Gerando sua próxima questão...',
  question: 'Questão',
  confidenceQuestion: 'Quão confiante você está na sua resposta?',
  notConfident: 'Pouco confiante',
  veryConfident: 'Muito confiante',
  excellent: 'Excelente!',
  keepLearning: 'Continue Aprendendo!',
  aiEvaluation: 'Avaliação da IA:',
  modelAnswer: 'Resposta Modelo:',
  elaborativePrompt: 'Interrogação Elaborativa: Por que você acha que esta é a resposta correta?',
  explainReasoning: 'Explique seu raciocínio e por que esta resposta faz sentido...',
  selfExplanationPrompt: 'Explique com suas palavras por que a resposta correta está certa',
  selfExplanationPlaceholder: 'Escreva sua explicação...',
  endSession: 'Finalizar Sessão',
  tryAgain: 'Tentar Novamente',
  submitAnswer: 'Enviar Resposta',
  evaluating: 'Avaliando...',
  nextQuestion: 'Próxima Questão',
  
  // Session History
  studyHistory: 'Histórico de Estudos',
  reviewProgress: 'Revise suas sessões de estudo anteriores e progresso',
  newSession: 'Nova Sessão',
  noSessionsYet: 'Ainda Não Há Sessões de Estudo',
  startFirstSession: 'Iniciar Primeira Sessão',
  questionsAnswered: 'Questões Respondidas',
  date: 'Data',
  accuracy: 'Precisão',
  continue: 'Continuar',
  viewDetails: 'Ver Detalhes',
  correctAnswers: 'Respostas Corretas',
  
  // Session Details
  sessionNotFound: 'Sessão Não Encontrada',
  sessionNotFoundDesc: 'A sessão de estudo que você está procurando não existe.',
  backToHistory: 'Voltar ao Histórico',
  sessionDetails: 'Detalhes da Sessão de Estudo',
  questionsAndAnswers: 'Questões e Respostas',
  correct: 'Correto',
  yourAnswer: 'Sua Resposta',
  feedback: 'Feedback:',
  attempts: 'tentativas',
  attempt: 'tentativa',
  reviewQuestion: 'Revisão',
  answerScore: 'Nota',
  continueSession: 'Continuar Sessão',
  
  // Settings
  settingsTitle: 'Configurações',
  configurePreferences: 'Configure suas preferências do Studorama e técnicas de aprendizado',
  apiKeyStored: 'Sua chave da API é armazenada no armazenamento local deste navegador e é enviada apenas ao provedor de IA selecionado em cada requisição.',
  spacedRepetition: 'Repetição Espaçada',
  interleaving: 'Intercalação',
  elaborativeInterrogation: 'Interrogação Elaborativa',
  selfExplanation: 'Auto-Explicação',
  desirableDifficulties: 'Dificuldades Desejáveis',
  language: 'Idioma',
  selectLanguage: 'Selecione seu idioma preferido',
  openSourceProject: 'Projeto de Código Aberto',
  openSourceDescription: 'O Studorama é completamente de código aberto e está disponível no GitHub. Você pode visualizar o código, contribuir com melhorias, relatar problemas ou fazer fork do projeto para seu próprio uso.',
  viewOnGitHub: 'Ver no GitHub',
  ready: 'Pronto',
  requiresApiKey: 'Requer Chave da API',
  
  // AI Provider Settings - NEW TRANSLATIONS
  aiProvider: 'Provedor de IA',
  providerConfiguration: 'Configuração do Provedor',
  invalidConfiguration: 'Configuração Inválida',
  invalidApiKeyFormat: 'Formato de chave da API inválido',
  costTier: 'Nível de Custo',
  recommended: 'Recomendado',
  
  // Setup Instructions
  setupInstructions: 'Instruções de Configuração',
  howToGetKey: 'Como obter sua chave da API:',
  
  // Configuration Fields
  baseUrl: 'URL Base',
  baseUrlPlaceholder: 'http://localhost:11434/v1',
  model: 'Modelo',
  modelInputHelp: 'Digite qualquer ID de modelo suportado pelo seu provedor ou escolha uma sugestão abaixo.',
  suggestedModels: 'Modelos sugeridos',
  
  // Data Management
  manageYourData: 'Gerencie seus dados do Studorama e privacidade',
  deleteAllData: 'Excluir Todos os Dados',
  deleteAllDataConfirm: 'Tem certeza de que deseja excluir TODOS os seus dados do Studorama? Isso inclui sessões, configurações, chaves da API e preferências.',
  deleteAllDataDesc: 'Excluir permanentemente todas as suas sessões de estudo, configurações, chaves da API e preferências',
  
  // Language Switch Modal
  cancel: 'Cancelar',
  
  // Pricing
  supportStudorama: 'Apoie o Studorama',
  supportStudoramaDesc: 'O Studorama é completamente gratuito para usar e sempre será. Seu apoio nos ajuda a manter e melhorar a plataforma para todos.',
  freeForever: 'App gratuito • Use sua própria chave de IA',
  freeForeverDesc: 'Todos os recursos são gratuitos e nenhuma conta é necessária. As chamadas de IA são cobradas pelo seu próprio provedor, ou não custam nada com um modelo local do Ollama. Os apoios mantêm o app gratuito.',
  noAccountRequired: 'Nenhuma Conta Necessária!',
  startLearningImmediately: 'Comece a aprender imediatamente',
  noAccountRequiredDesc: 'O Studorama funciona completamente sem criar uma conta. Suas sessões de estudo são salvas localmente no seu navegador. Todos os recursos com IA, repetição espaçada e técnicas de aprendizado estão disponíveis instantaneamente.',
  whySponsorStudorama: 'Por que Apoiar o Studorama?',
  keepItFree: 'Manter Gratuito',
  keepItFreeDesc: 'Nos ajude a manter o Studorama como uma plataforma completamente gratuita e sem necessidade de conta para todos os estudantes do mundo.',
  fundDevelopment: 'Financiar Desenvolvimento',
  fundDevelopmentDesc: 'Apoie o desenvolvimento contínuo de novos recursos e melhorias para aprimorar o aprendizado.',
  serverCosts: 'Custos do Servidor',
  serverCostsDesc: 'Cubra hospedagem, custos da API de IA e infraestrutura para manter a plataforma funcionando perfeitamente.',
  privacyFirst: 'Privacidade Primeiro',
  privacyFirstDesc: 'Apoie uma plataforma que respeita a privacidade ao não exigir contas ou coletar dados pessoais.',
  privacyFocused: 'Focado na Privacidade',
  dataStaysInBrowser: 'Sessões e chaves ficam no seu navegador',
  noTrackingOrAnalytics: 'Sem rastreamento ou análises',
  completeAnonymity: 'Anonimato completo',
  transparencyTrust: 'Transparência e Confiança',
  transparencyTrustDesc: 'Seu apoio vai diretamente para: custos de hospedagem, tempo de desenvolvimento e manutenção da plataforma. O uso de IA é cobrado pelo provedor escolhido na chave da API que você configurar. Acreditamos em manter a educação acessível para todos, independentemente de sua situação financeira ou disposição para criar contas. O Studorama sempre permanecerá gratuito e sem necessidade de conta.',
  
  // Theme Support
  theme: 'Tema',
  selectTheme: 'Selecionar Tema',
  
  // API Key Notifications
  apiKeyConfigured: 'Chave da API Configurada',
  apiKeyConfiguredDesc: 'Chave da API foi configurada automaticamente a partir da URL',
  invalidApiKey: 'Chave da API Inválida',
  invalidApiKeyDesc: 'A chave da API na URL não é válida. Verifique o formato.',
  apiKeyUnknownProvider: 'Provedor desconhecido "{provider}" no link. Provedores suportados: {providers}.',

  // Storage
  storageWriteFailed: 'Não foi possível salvar seus dados',
  storageWriteFailedDesc: 'O armazenamento do navegador está cheio ou indisponível, então as alterações recentes serão perdidas ao recarregar. Exclua sessões antigas nas Configurações para liberar espaço.',
  
  // Version Control
  appUpdated: 'Studorama Atualizado!',
  versionUpdated: 'Atualizado da v{oldVersion} para v{newVersion}',
  dataRefreshed: 'Suas chaves de API e configurações de provedores, sessões de estudo, idioma e tema foram mantidos. Outros dados em cache foram apagados.',
  
  // AI errors
  aiErrorMissingApiKey: 'Adicione uma chave de API do seu provedor de IA nas Configurações.',
  aiErrorMissingContext: 'Por favor, adicione pelo menos um contexto de estudo.',
  aiErrorInvalidConfig: 'As configurações do provedor de IA estão incompletas. Verifique a chave de API, o modelo e a URL nas Configurações.',
  aiErrorInvalidApiKey: 'O provedor de IA recusou sua chave de API. Verifique-a nas Configurações.',
  aiErrorRateLimited: 'O provedor de IA está limitando as requisições ou sua cota acabou. Aguarde um momento e tente novamente.',
  aiErrorProvider: 'O provedor de IA retornou um erro.',
  aiErrorInvalidResponse: 'A IA retornou uma resposta que o Studorama não conseguiu usar. Tente novamente.',
  aiErrorNetwork: 'Não foi possível acessar o provedor de IA. Verifique sua conexão com a internet.',
  aiErrorOllamaConnection: 'Não foi possível conectar ao Ollama. Verifique se o Ollama está em execução e acessível.',
  aiErrorTimeout: 'O provedor de IA demorou demais para responder. Tente novamente.',
  aiErrorUnknown: 'Algo deu errado com a requisição de IA. Tente novamente.',

  // Badges
  freeAppBadgeShort: 'App gratuito • Sua chave de IA',
  dashboardBadge: 'Sem conta • App gratuito • Use sua própria chave de IA',

  // Common
  error: 'Erro',
  delete: 'Excluir',
  edit: 'Editar',
  save: 'Salvar'
};
