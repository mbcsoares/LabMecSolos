import { Redirect, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonMenu, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, clipboardOutline, cubeOutline, calendarOutline, personOutline } from 'ionicons/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import ColaboradorGuard from './components/ColaboradorGuard';
import NavigationDrawer from './components/NavigationDrawer';
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmAccountPage from './pages/ConfirmAccountPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RecoveryCodePage from './pages/RecoveryCodePage';
import NewPasswordPage from './pages/NewPasswordPage';
import HomePage from './pages/HomePage';
import PesquisasPage from './pages/PesquisasPage';
import AmostrasPage from './pages/AmostrasPage';
import EnsaiosPage from './pages/EnsaiosPage';
import CalendarioLaboratorioPage from './pages/CalendarioLaboratorioPage';
import DetalhesDiaPage from './pages/DetalhesDiaPage';
import SolicitarAgendamentoPage from './pages/SolicitarAgendamentoPage';
import MeusAgendamentosPage from './pages/MeusAgendamentosPage';
import DetalhesAgendamentoPage from './pages/DetalhesAgendamentoPage';
import SolicitacoesPendentesPage from './pages/SolicitacoesPendentesPage';
import AnalisarSolicitacaoPage from './pages/AnalisarSolicitacaoPage';
import AgendamentosDiaPage from './pages/AgendamentosDiaPage';
import RegistrarComparecimentoPage from './pages/RegistrarComparecimentoPage';
import TodosAgendamentosPage from './pages/TodosAgendamentosPage';
import ConfigurarCalendarioPage from './pages/ConfigurarCalendarioPage';
import EditarDiaPage from './pages/EditarDiaPage';
import ListaCalendariosPage from './pages/ListaCalendariosPage';
import ConfiguracoesLaboratorioPage from './pages/ConfiguracoesLaboratorioPage';
import PainelGerencialPage from './pages/PainelGerencialPage';
import ConfiguracoesSistemaPage from './pages/ConfiguracoesSistemaPage';
import MapaGeotecnicoPage from './pages/MapaGeotecnicoPage';
import MetadadosFormPage from './pages/MetadadosFormPage';
import PerfilPage from './pages/PerfilPage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MinhasOcorrenciasPage from './pages/MinhasOcorrenciasPage';
import DeletarContaPage from './pages/DeletarContaPage';
import AjudaSobrePage from './pages/AjudaSobrePage';
import AtividadePage from './pages/AtividadePage';
import NotificacoesPage from './pages/NotificacoesPage';
import AdminUsuariosListPage from './pages/AdminUsuariosListPage';
import AdminUsuarioDetalhePage from './pages/AdminUsuarioDetalhePage';
import AdminTransferirChefiaPage from './pages/AdminTransferirChefiaPage';
import AdminUsuarioHistoricoPage from './pages/AdminUsuarioHistoricoPage';
import InventarioDashboardPage from './pages/InventarioDashboardPage';
import InventarioListaItensPage from './pages/InventarioListaItensPage';
import InventarioItemDetalhePage from './pages/InventarioItemDetalhePage';
import QRCodeVisualizacaoPage from './pages/QRCodeVisualizacaoPage';
import QRCodeLeituraPage from './pages/QRCodeLeituraPage';
import OcorrenciasListaPage from './pages/OcorrenciasListaPage';
import OcorrenciaCadastroPage from './pages/OcorrenciaCadastroPage';
import OcorrenciaDetalhePage from './pages/OcorrenciaDetalhePage';
import CategoriasPage from './pages/CategoriasPage';
import InventarioItemCadastroPage from './pages/InventarioItemCadastroPage';
import InventarioEntradaSaidaPage from './pages/InventarioEntradaSaidaPage';
import InventarioAlterarEstadoPage from './pages/InventarioAlterarEstadoPage';
import InventarioHistoricoEstadoPage from './pages/InventarioHistoricoEstadoPage';
import InventarioVerificacoesPage from './pages/InventarioVerificacoesPage';
import LotesPage from './pages/LotesPage';
import InventarioHistoricoCalibracoesPage from './pages/InventarioHistoricoCalibracoesPage';
import PesquisasListaPage from './pages/PesquisasListaPage';
import PesquisaDetalhePage from './pages/PesquisaDetalhePage';
import PesquisaFormPage from './pages/PesquisaFormPage';
import AdicionarColaboradorPage from './pages/AdicionarColaboradorPage';
import ProgramasListaPage from './pages/ProgramasListaPage';
import ProgramaDetalhePage from './pages/ProgramaDetalhePage';
import ProgramaFormPage from './pages/ProgramaFormPage';
import PontoColetaFormPage from './pages/PontoColetaFormPage';
import AmostrasBrutasListaPage from './pages/AmostrasBrutasListaPage';
import AmostraBrutaDetalhePage from './pages/AmostraBrutaDetalhePage';
import AmostraBrutaFormPage from './pages/AmostraBrutaFormPage';
import PrepararAmostraPage from './pages/PrepararAmostraPage';
import AmostrasPreparadasListaPage from './pages/AmostrasPreparadasListaPage';
import AmostrasIndeformadasListaPage from './pages/AmostrasIndeformadasListaPage';
import AmostraPreparadaDetalhePage from './pages/AmostraPreparadaDetalhePage';
import FracionarEnsaioPage from './pages/FracionarEnsaioPage';
import RegistrarIndeformadaPage from './pages/RegistrarIndeformadaPage';
import AmostraIndeformadaDetalhePage from './pages/AmostraIndeformadaDetalhePage';
import AmostraEnsaiadaDetalhePage from './pages/AmostraEnsaiadaDetalhePage';
import EnsaiosListaPage from './pages/EnsaiosListaPage';
import EnsaioDetalhePage from './pages/EnsaioDetalhePage';
import NovoEnsaioPage from './pages/NovoEnsaioPage';
import ExecutarTeorUmidadePage from './pages/ExecutarTeorUmidadePage';
import NovaDeterminacaoPage from './pages/NovaDeterminacaoPage';
import EditarDeterminacaoPage from './pages/EditarDeterminacaoPage';
import RastreabilidadePage from './pages/RastreabilidadePage';
import RelatoriosPage from './pages/RelatoriosPage';
import RelatorioEnsaioPage from './pages/RelatorioEnsaioPage';
import RelatorioPesquisaPage from './pages/RelatorioPesquisaPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';

setupIonicReact();

const TabBarConditional: React.FC = () => {
  const location = useLocation();
  const visible = location.pathname.startsWith('/app/');

  return (
    <IonTabBar slot="bottom" style={{ display: visible ? 'flex' : 'none' }}>
      <IonTabButton tab="home" href="/app/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="pesquisas" href="/app/pesquisas">
        <IonIcon icon={clipboardOutline} />
        <IonLabel>Pesquisas</IonLabel>
      </IonTabButton>
      <IonTabButton tab="amostras" href="/app/amostras">
        <IonIcon icon={cubeOutline} />
        <IonLabel>Amostras</IonLabel>
      </IonTabButton>
      <IonTabButton tab="agendar" href="/app/agendar">
        <IonIcon icon={calendarOutline} />
        <IonLabel>Agendar</IonLabel>
      </IonTabButton>
      <IonTabButton tab="perfil" href="/app/perfil">
        <IonIcon icon={personOutline} />
        <IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

const ProtectedRoutes: React.FC = () => {
  const { usuario } = useAuth();
  const routeKey = usuario?.userId ?? 'no-user';

  return (
    <>
      <Route exact path="/app/home">
        <AuthGuard key={routeKey}><HomePage /></AuthGuard>
      </Route>
      <Route exact path="/app/pesquisas">
        <AuthGuard key={routeKey}><PesquisasPage /></AuthGuard>
      </Route>
      <Route exact path="/app/amostras">
        <AuthGuard key={routeKey}><AmostrasPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios">
        <AuthGuard key={routeKey}><EnsaiosPage /></AuthGuard>
      </Route>
      <Route exact path="/app/agendar">
        <AuthGuard key={routeKey}><CalendarioLaboratorioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/perfil">
        <AuthGuard key={routeKey}><PerfilPage /></AuthGuard>
      </Route>
      <Route exact path="/app/editar-perfil">
        <AuthGuard key={routeKey}><EditProfilePage /></AuthGuard>
      </Route>
      <Route exact path="/app/alterar-senha">
        <AuthGuard key={routeKey}><ChangePasswordPage /></AuthGuard>
      </Route>
      <Route exact path="/app/deletar-conta">
        <AuthGuard key={routeKey}><DeletarContaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario">
        <AuthGuard key={routeKey}><InventarioDashboardPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/itens">
        <AuthGuard key={routeKey}><InventarioListaItensPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/novo-item">
        <AuthGuard key={routeKey}><InventarioItemCadastroPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id">
        <AuthGuard key={routeKey}><InventarioItemDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/qrcode">
        <AuthGuard key={routeKey}><QRCodeVisualizacaoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/qrcode/ler">
        <AuthGuard key={routeKey}><QRCodeLeituraPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/ocorrencias">
        <AuthGuard key={routeKey}><OcorrenciasListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/ocorrencias/nova">
        <AuthGuard key={routeKey}><OcorrenciaCadastroPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/ocorrencia/:id">
        <AuthGuard key={routeKey}><OcorrenciaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/categorias">
        <AuthGuard key={routeKey}><CategoriasPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/editar">
        <AuthGuard key={routeKey}><InventarioItemCadastroPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/movimentacoes">
        <AuthGuard key={routeKey}><InventarioEntradaSaidaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/alterar-estado">
        <AuthGuard key={routeKey}><InventarioAlterarEstadoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/historico-estado">
        <AuthGuard key={routeKey}><InventarioHistoricoEstadoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/verificacoes">
        <AuthGuard key={routeKey}><InventarioVerificacoesPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/lotes">
        <AuthGuard key={routeKey}><LotesPage /></AuthGuard>
      </Route>
      <Route exact path="/app/inventario/item/:id/historico-calibracoes">
        <AuthGuard key={routeKey}><InventarioHistoricoCalibracoesPage /></AuthGuard>
      </Route>

      <Route exact path="/app/ensaios/pesquisas">
        <AuthGuard key={routeKey}><PesquisasListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/lista">
        <AuthGuard key={routeKey}><EnsaiosListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/novo-ensaio">
        <AuthGuard key={routeKey}><NovoEnsaioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/:ensaioId/editar">
        <AuthGuard key={routeKey}><NovoEnsaioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/nova-pesquisa">
        <AuthGuard key={routeKey}><PesquisaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/novo-programa">
        <AuthGuard key={routeKey}><ProgramaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/programa/:programaId/editar">
        <AuthGuard key={routeKey}><ProgramaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/pesquisa/:id">
        <AuthGuard key={routeKey}><PesquisaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/pesquisa/:id/editar">
        <AuthGuard key={routeKey}><PesquisaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/pesquisa/:id/adicionar-colaborador">
        <AuthGuard key={routeKey}><AdicionarColaboradorPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/pesquisa/:id/programa/:programaId">
        <AuthGuard key={routeKey}><ProgramaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/programa/:programaId/ponto/novo">
        <AuthGuard key={routeKey}><PontoColetaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/ponto/:pontoId/editar">
        <AuthGuard key={routeKey}><PontoColetaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/ponto/:pontoId/amostras">
        <AuthGuard key={routeKey}><AmostrasBrutasListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/ponto/:pontoId/amostra/novo">
        <AuthGuard key={routeKey}><AmostraBrutaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id/editar">
        <AuthGuard key={routeKey}><AmostraBrutaFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id">
        <AuthGuard key={routeKey}><AmostraBrutaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id/preparar">
        <AuthGuard key={routeKey}><PrepararAmostraPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-preparada/:id/editar">
        <AuthGuard key={routeKey}><PrepararAmostraPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id/indeformada">
        <AuthGuard key={routeKey}><RegistrarIndeformadaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-indeformada/:indeformadaId/editar">
        <AuthGuard key={routeKey}><RegistrarIndeformadaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-indeformada/:id">
        <AuthGuard key={routeKey}><AmostraIndeformadaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-ensaiada/:id">
        <AuthGuard key={routeKey}><AmostraEnsaiadaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id/rastreabilidade">
        <AuthGuard key={routeKey}><RastreabilidadePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-preparada/:id">
        <AuthGuard key={routeKey}><AmostraPreparadaDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-preparada/:id/fracionar">
        <AuthGuard key={routeKey}><FracionarEnsaioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-ensaiada/:ensaiadaId/editar">
        <AuthGuard key={routeKey}><FracionarEnsaioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra-preparada/:id/preparadas">
        <AuthGuard key={routeKey}><AmostrasPreparadasListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/amostra/:id/indeformadas">
        <AuthGuard key={routeKey}><AmostrasIndeformadasListaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/:id">
        <AuthGuard key={routeKey}><EnsaioDetalhePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/:id/teor-umidade">
        <AuthGuard key={routeKey}><ExecutarTeorUmidadePage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/:id/determinacao/novo">
        <AuthGuard key={routeKey}><NovaDeterminacaoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/determinacao/:id">
        <AuthGuard key={routeKey}><EditarDeterminacaoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ensaios/:id/relatorio">
        <AuthGuard key={routeKey}><RelatorioEnsaioPage /></AuthGuard>
      </Route>

      <Route exact path="/app/agendamentos">
        <AuthGuard key={routeKey}><MeusAgendamentosPage /></AuthGuard>
      </Route>
      <Route exact path="/app/agendamentos/:id">
        <AuthGuard key={routeKey}><DetalhesAgendamentoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ocorrencias">
        <AuthGuard key={routeKey}><MinhasOcorrenciasPage /></AuthGuard>
      </Route>
      <Route exact path="/app/atividade">
        <AuthGuard key={routeKey}><AtividadePage /></AuthGuard>
      </Route>
      <Route exact path="/app/notificacoes">
        <AuthGuard key={routeKey}><NotificacoesPage /></AuthGuard>
      </Route>
      <Route exact path="/app/solicitacoes-pendentes">
        <AuthGuard key={routeKey}><SolicitacoesPendentesPage /></AuthGuard>
      </Route>
      <Route exact path="/app/solicitacoes-pendentes/:id">
        <AuthGuard key={routeKey}><AnalisarSolicitacaoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/configurar-calendario">
        <AuthGuard key={routeKey}><ConfigurarCalendarioPage /></AuthGuard>
      </Route>
      <Route exact path="/app/configurar-calendario/:idCalendario/dia/:dia">
        <AuthGuard key={routeKey}><EditarDiaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/calendarios">
        <AuthGuard key={routeKey}><ListaCalendariosPage /></AuthGuard>
      </Route>
      <Route exact path="/app/configuracoes-laboratorio">
        <AuthGuard key={routeKey}><AdminGuard><ConfiguracoesLaboratorioPage /></AdminGuard></AuthGuard>
      </Route>
      <Route exact path="/app/agendar/dia/:data">
        <AuthGuard key={routeKey}><DetalhesDiaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/agendar/dia/:data/agendamentos">
        <AuthGuard key={routeKey}><ColaboradorGuard><AgendamentosDiaPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/agendar/solicitar">
        <AuthGuard key={routeKey}><SolicitarAgendamentoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/agendamentos-dia/:data/comparecimento">
        <AuthGuard key={routeKey}><ColaboradorGuard><RegistrarComparecimentoPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/todos-agendamentos">
        <AuthGuard key={routeKey}><ColaboradorGuard><TodosAgendamentosPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/gerenciar-inventario">
        <AuthGuard key={routeKey}><ColaboradorGuard><InventarioDashboardPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/todas-ocorrencias">
        <AuthGuard key={routeKey}><ColaboradorGuard><OcorrenciasListaPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/relatorios">
        <AuthGuard key={routeKey}><ColaboradorGuard><RelatoriosPage /></ColaboradorGuard></AuthGuard>
      </Route>
      <Route exact path="/app/gerenciar-usuarios">
        <AuthGuard key={routeKey}><AdminGuard><AdminUsuariosListPage /></AdminGuard></AuthGuard>
      </Route>
      <Route exact path="/app/admin/usuario/:id">
        <AuthGuard key={routeKey}><AdminGuard><AdminUsuarioDetalhePage /></AdminGuard></AuthGuard>
      </Route>
      <Route exact path="/app/admin/transferir-chefia">
        <AuthGuard key={routeKey}><AdminGuard><AdminTransferirChefiaPage /></AdminGuard></AuthGuard>
      </Route>
      <Route exact path="/app/admin/usuario/:id/historico">
        <AuthGuard key={routeKey}><AdminGuard><AdminUsuarioHistoricoPage /></AdminGuard></AuthGuard>
      </Route>
      <Route exact path="/app/painel-gerencial">
        <AuthGuard key={routeKey}><PainelGerencialPage /></AuthGuard>
      </Route>
      <Route exact path="/app/mapa-estudo-solos">
        <AuthGuard key={routeKey}><MapaGeotecnicoPage /></AuthGuard>
      </Route>
      <Route exact path="/app/geotecnico/metadados/:idAmostra">
        <AuthGuard key={routeKey}><MetadadosFormPage /></AuthGuard>
      </Route>
      <Route exact path="/app/configuracoes">
        <AuthGuard key={routeKey}><ConfiguracoesSistemaPage /></AuthGuard>
      </Route>
      <Route exact path="/app/ajuda">
        <AuthGuard key={routeKey}><AjudaSobrePage /></AuthGuard>
      </Route>
    </>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AuthProvider>
        <IonMenu side="start" contentId="main-content" type="overlay" style={{ maxWidth: 320 }}>
          <NavigationDrawer />
        </IonMenu>

        <IonTabs>
          <IonRouterOutlet id="main-content">
            <Route exact path="/splash" component={SplashPage} />
            <Route exact path="/login" component={LoginPage} />
            <Route exact path="/register" component={RegisterPage} />
            <Route exact path="/confirm-account" component={ConfirmAccountPage} />
            <Route exact path="/forgot-password" component={ForgotPasswordPage} />
            <Route exact path="/recovery-code" component={RecoveryCodePage} />
            <Route exact path="/new-password" component={NewPasswordPage} />
            <Route exact path="/sobre" component={AjudaSobrePage} />

            <ProtectedRoutes />

            <Route exact path="/">
              <Redirect to="/splash" />
            </Route>
          </IonRouterOutlet>

          <TabBarConditional />
        </IonTabs>
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
