// Constantes y variables globales
let CATEGORIAS = [
    { id: 'playstation', nombre: 'PlayStation', tipo: 'ingreso' },
    { id: 'diseno', nombre: 'Diseño Gráfico', tipo: 'ingreso' },
    { id: 'programacion', nombre: 'Programación web', tipo: 'ingreso' },
    { id: 'kiosko', nombre: 'Kiosko', tipo: 'ingreso' },
    { id: 'informatica', nombre: 'Informática', tipo: 'ingreso' },
    { id: 'otros-ingreso', nombre: 'Otros', tipo: 'ingreso' },
    { id: 'playstation-egreso', nombre: 'PlayStation', tipo: 'egreso' },
    { id: 'diseno-egreso', nombre: 'Diseño Gráfico', tipo: 'egreso' },
    { id: 'programacion-egreso', nombre: 'Programación web', tipo: 'egreso' },
    { id: 'kiosko-egreso', nombre: 'Kiosko', tipo: 'egreso' },
    { id: 'informatica-egreso', nombre: 'Informática', tipo: 'egreso' },
    { id: 'impuestos', nombre: 'Impuestos', tipo: 'egreso' },
    { id: 'otros-egreso', nombre: 'Otros', tipo: 'egreso' }
];

let movimientos = [];
let editarModal = null;
let graficoComparacion = null;
let graficoCategorias = null;
let graficoEvolucion = null;

// Funciones de utilidad
function obtenerFechaActual() {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(valor);
}

function formatearFecha(fecha) {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-AR', opciones);
}

function validarFecha(fecha) {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? new Date() : date;
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alertasContainer = document.getElementById('alertas-container');
    if (!alertasContainer) return;
    
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} position-fixed top-0 start-50 translate-middle-x mt-3`;
    alerta.style.zIndex = '1060';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertasContainer.appendChild(alerta);
    
    // Auto-eliminar la alerta después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Inicialización de la aplicación
function inicializarApp() {
    try {
        // Configurar modal de edición
        const modalElement = document.getElementById('editarModal');
        if (modalElement) {
            editarModal = new bootstrap.Modal(modalElement);
        }
        
        // Configurar pestañas
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                cambiarPestana(this);
            });
        });
        
        // Cargar datos y configurar formularios
        cargarDatos();
        configurarFormularios();
        inicializarFiltros();
        
        // Establecer fecha actual en el formulario
        const fechaInput = document.getElementById('fecha-movimiento');
        if (fechaInput) {
            fechaInput.value = obtenerFechaActual();
        }
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarAlerta('Error al cargar la aplicación. Por favor recarga la página.', 'danger');
    }
}

function cambiarPestana(tab) {
    const tabId = tab.getAttribute('data-tab');
    
    // Actualizar pestañas activas
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    tab.classList.add('active');
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Actualizar reportes si es necesario
    if (tabId === 'reportes') {
        actualizarReportes();
    }
    
    // Actualizar categorías si es necesario
    if (tabId === 'categorias') {
        mostrarCategorias();
    }
}

function configurarFormularios() {
    // Formulario de registro
    const formMovimiento = document.getElementById('form-movimiento');
    if (formMovimiento) {
        formMovimiento.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarMovimiento();
        });
    }
    
    // Formulario de edición
    const guardarBtn = document.getElementById('guardar-cambios-btn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarCambios);
    }
    
    const eliminarBtn = document.getElementById('eliminar-btn');
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', eliminarMovimiento);
    }
    
    // Radio buttons para cambiar categorías
    document.querySelectorAll('[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', cargarCategorias);
    });
    
    // Formulario de categorías
    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
        formCategoria.addEventListener('submit', function(e) {
            e.preventDefault();
            agregarCategoria();
        });
    }
    
    // Filtro de categorías
    const filtroTipoCategoria = document.getElementById('filtro-tipo-categoria');
    if (filtroTipoCategoria) {
        filtroTipoCategoria.addEventListener('change', mostrarCategorias);
    }
    
    // Cargar categorías iniciales
    cargarCategorias();
}

function cargarDatos() {
    try {
        const datosGuardados = localStorage.getItem('finanzas_data');
        const categoriasGuardadas = localStorage.getItem('finanzas_categorias');
        
        // Cargar categorías personalizadas
        if (categoriasGuardadas) {
            CATEGORIAS = JSON.parse(categoriasGuardadas);
        } else {
            guardarCategorias();
        }
        
        if (datosGuardados) {
            movimientos = JSON.parse(datosGuardados).map(m => ({
                ...m,
                fecha: validarFecha(m.fecha)
            }));
        } else {
            // Datos de ejemplo
            const hoy = new Date();
            movimientos = [
                {
                    id: Date.now(),
                    fecha: hoy,
                    tipo: 'ingreso',
                    categoria: 'playstation',
                    descripcion: 'Alquiler PS4',
                    monto: 5000
                },
                {
                    id: Date.now() + 1,
                    fecha: hoy,
                    tipo: 'egreso',
                    categoria: 'impuestos',
                    descripcion: 'Pago de impuestos',
                    monto: 3500
                }
            ];
            guardarDatos();
        }
        
        actualizarUI();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarAlerta('Error al cargar los datos. Se reiniciará con datos de ejemplo.', 'warning');
        movimientos = [];
        guardarDatos();
    }
}

function guardarDatos() {
    try {
        localStorage.setItem('finanzas_data', JSON.stringify(movimientos));
    } catch (error) {
        console.error('Error al guardar datos:', error);
        mostrarAlerta('No se pudieron guardar los datos. El almacenamiento local puede estar lleno.', 'danger');
    }
}

function guardarCategorias() {
    try {
        localStorage.setItem('finanzas_categorias', JSON.stringify(CATEGORIAS));
    } catch (error) {
        console.error('Error al guardar categorías:', error);
        mostrarAlerta('No se pudieron guardar las categorías.', 'danger');
    }
}

// Funciones para categorías
function cargarCategorias() {
    const tipoRadio = document.querySelector('[name="tipo"]:checked');
    if (!tipoRadio) return;
    
    const tipo = tipoRadio.value;
    const categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === tipo);
    
    const select = document.getElementById('categoria-movimiento');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        select.appendChild(option);
    });
}

// Funciones para filtros
function inicializarFiltros() {
    inicializarFiltroAnios();
    inicializarFiltroMeses();
    inicializarFiltroCategorias();
    
    // Event listeners para los filtros
    const filtroPeriodo = document.getElementById('filtro-periodo');
    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', actualizarReportes);
    }
    
    const filtroAnio = document.getElementById('filtro-anio');
    if (filtroAnio) {
        filtroAnio.addEventListener('change', actualizarReportes);
    }
    
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) {
        filtroMes.addEventListener('change', actualizarReportes);
    }
    
    const filtroTipo = document.getElementById('filtro-tipo');
    if (filtroTipo) {
        filtroTipo.addEventListener('change', actualizarReportes);
    }
    
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', actualizarReportes);
    }
    
    // Event listeners para exportación/importación
    const exportarBtn = document.getElementById('exportar-btn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarAExcel);
    }
    
    const exportarJsonBtn = document.getElementById('exportar-json-btn');
    if (exportarJsonBtn) {
        exportarJsonBtn.addEventListener('click', exportarAJSON);
    }
    
    const importarBtn = document.getElementById('importar-btn');
    if (importarBtn) {
        importarBtn.addEventListener('click', () => {
            const importarInput = document.getElementById('importar-input');
            if (importarInput) {
                importarInput.click();
            }
        });
    }
    
    const importarInput = document.getElementById('importar-input');
    if (importarInput) {
        importarInput.addEventListener('change', importarDatos);
    }
    
    // Inicializar búsqueda avanzada
    inicializarBusquedaAvanzada();
}

function inicializarFiltroAnios() {
    const select = document.getElementById('filtro-anio');
    if (!select) return;
    
    select.innerHTML = '<option value="todos" selected>Todos los años</option>';
    
    const añosUnicos = [...new Set(movimientos.map(m => new Date(m.fecha).getFullYear()))].sort((a, b) => b - a);
    
    añosUnicos.forEach(año => {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        select.appendChild(option);
    });
}

function inicializarFiltroMeses() {
    const select = document.getElementById('filtro-mes');
    if (!select) return;
    
    select.innerHTML = '<option value="todos" selected>Todos los meses</option>';
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = mes;
        select.appendChild(option);
    });
}

function inicializarFiltroCategorias() {
    const select = document.getElementById('filtro-categoria');
    if (!select) return;
    
    select.innerHTML = '<option value="todas" selected>Todas las categorías</option>';
    
    const categoriasUnicas = {};
    CATEGORIAS.forEach(cat => {
        if (!categoriasUnicas[cat.nombre]) {
            categoriasUnicas[cat.nombre] = cat;
        }
    });
    
    Object.values(categoriasUnicas)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.nombre;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
}

// Funciones para movimientos
function guardarMovimiento() {
    try {
        const form = document.getElementById('form-movimiento');
        if (!form) {
            throw new Error('Formulario no encontrado');
        }
        
        // Obtener valores del formulario usando los name attributes
        const formData = new FormData(form);
        const monto = parseFloat(formData.get('monto'));
        const categoria = formData.get('categoria');
        const tipo = formData.get('tipo');
        const descripcion = formData.get('descripcion') || '';
        const fecha = formData.get('fecha');
        
        // Validaciones
        if (isNaN(monto) || monto <= 0) {
            throw new Error('El monto debe ser un número positivo');
        }
        
        if (!categoria) {
            throw new Error('Seleccione una categoría');
        }
        
        if (!fecha) {
            throw new Error('Seleccione una fecha');
        }
        
        // Crear nuevo movimiento
        const nuevoMovimiento = {
            id: Date.now(),
            fecha: validarFecha(fecha),
            tipo: tipo,
            categoria: categoria,
            descripcion: descripcion,
            monto: monto
        };
        
        // Agregar y actualizar
        movimientos.unshift(nuevoMovimiento);
        guardarDatos();
        actualizarUI();
        
        // Resetear formulario
        form.reset();
        const fechaInput = document.getElementById('fecha-movimiento');
        if (fechaInput) {
            fechaInput.value = obtenerFechaActual();
        }
        
        // Recargar categorías después del reset
        cargarCategorias();
        
        mostrarAlerta('Movimiento registrado correctamente', 'success');
        cambiarPestana(document.querySelector('[data-tab="resumen"]'));
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        console.error(error);
    }
}

function abrirEdicion(id) {
    const movimiento = movimientos.find(m => m.id === id);
    if (!movimiento) {
        mostrarAlerta('Movimiento no encontrado', 'danger');
        return;
    }
    
    // Llenar formulario de edición
    document.getElementById('editar-id').value = movimiento.id;
    document.getElementById('editar-descripcion').value = movimiento.descripcion;
    document.getElementById('editar-monto').value = movimiento.monto;
    document.getElementById('editar-fecha').value = movimiento.fecha instanceof Date ? 
        movimiento.fecha.toISOString().split('T')[0] : movimiento.fecha;
    
    // Seleccionar tipo
    const tipoRadio = document.querySelector(`[name="editar-tipo"][value="${movimiento.tipo}"]`);
    if (tipoRadio) {
        tipoRadio.checked = true;
    }
    
    // Cargar categorías para edición y seleccionar la correcta
    cargarCategoriasEdicion(movimiento.tipo, movimiento.categoria);
    
    // Mostrar modal
    if (editarModal) {
        editarModal.show();
    }
}

function cargarCategoriasEdicion(tipo, categoriaSeleccionada) {
    const categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === tipo);
    const select = document.getElementById('editar-categoria');
    
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled>Seleccionar...</option>';
    
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        if (categoria.id === categoriaSeleccionada) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function guardarCambios() {
    try {
        const id = parseInt(document.getElementById('editar-id').value);
        const movimiento = movimientos.find(m => m.id === id);
        
        if (!movimiento) {
            throw new Error('Movimiento no encontrado');
        }
        
        // Obtener valores del formulario
        const monto = parseFloat(document.getElementById('editar-monto').value);
        const categoria = document.getElementById('editar-categoria').value;
        const descripcion = document.getElementById('editar-descripcion').value;
        const fecha = document.getElementById('editar-fecha').value;
        const tipo = document.querySelector('[name="editar-tipo"]:checked')?.value;
        
        // Validaciones
        if (isNaN(monto) || monto <= 0) {
            throw new Error('El monto debe ser un número positivo');
        }
        
        if (!categoria) {
            throw new Error('Seleccione una categoría');
        }
        
        if (!tipo) {
            throw new Error('Seleccione un tipo');
        }
        
        // Actualizar movimiento
        movimiento.monto = monto;
        movimiento.categoria = categoria;
        movimiento.descripcion = descripcion;
        movimiento.fecha = validarFecha(fecha);
        movimiento.tipo = tipo;
        
        guardarDatos();
        actualizarUI();
        
        if (editarModal) {
            editarModal.hide();
        }
        
        mostrarAlerta('Movimiento actualizado correctamente', 'success');
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        console.error(error);
    }
}

function eliminarMovimiento() {
    try {
        const id = parseInt(document.getElementById('editar-id').value);
        const index = movimientos.findIndex(m => m.id === id);
        
        if (index === -1) {
            throw new Error('Movimiento no encontrado');
        }
        
        if (confirm('¿Está seguro de que desea eliminar este movimiento?')) {
            movimientos.splice(index, 1);
            guardarDatos();
            actualizarUI();
            
            if (editarModal) {
                editarModal.hide();
            }
            
            mostrarAlerta('Movimiento eliminado correctamente', 'success');
        }
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        console.error(error);
    }
}

// Funciones de actualización de UI
function actualizarUI() {
    actualizarResumen();
    actualizarUltimosMovimientos();
    actualizarCategoriasResumen();
    inicializarFiltroAnios();
}

function actualizarResumen() {
    const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const balance = ingresos - egresos;
    
    // Actualizar elementos del DOM
    const totalIngresos = document.getElementById('total-ingresos');
    const totalEgresos = document.getElementById('total-egresos');
    const balanceTotal = document.getElementById('balance-total');
    
    if (totalIngresos) totalIngresos.textContent = formatearMoneda(ingresos);
    if (totalEgresos) totalEgresos.textContent = formatearMoneda(egresos);
    if (balanceTotal) {
        balanceTotal.textContent = formatearMoneda(balance);
        balanceTotal.className = `h4 mb-0 ${balance >= 0 ? 'text-success' : 'text-danger'}`;
    }
}

function actualizarUltimosMovimientos() {
    const container = document.getElementById('ultimos-movimientos');
    if (!container) return;
    
    const ultimosMovimientos = movimientos.slice(0, 5);
    
    if (ultimosMovimientos.length === 0) {
        container.innerHTML = '<div class="list-group-item">No hay movimientos registrados</div>';
        return;
    }
    
    container.innerHTML = ultimosMovimientos.map(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const nombreCategoria = categoria ? categoria.nombre : movimiento.categoria;
        
        return `
            <div class="list-group-item ${movimiento.tipo}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${nombreCategoria}</h6>
                        <p class="mb-1">${movimiento.descripcion || 'Sin descripción'}</p>
                        <small class="text-muted">${formatearFecha(movimiento.fecha)}</small>
                    </div>
                    <div class="text-end">
                        <h6 class="mb-1 ${movimiento.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                            ${movimiento.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(movimiento.monto)}
                        </h6>
                        <button class="btn btn-sm btn-outline-primary editar-btn" onclick="abrirEdicion(${movimiento.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function actualizarCategoriasResumen() {
    const container = document.getElementById('categorias-container');
    if (!container) return;
    
    // Calcular totales por categoría
    const totalesPorCategoria = {};
    
    movimientos.forEach(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const nombreCategoria = categoria ? categoria.nombre : movimiento.categoria;
        
        if (!totalesPorCategoria[nombreCategoria]) {
            totalesPorCategoria[nombreCategoria] = { ingreso: 0, egreso: 0 };
        }
        
        totalesPorCategoria[nombreCategoria][movimiento.tipo] += movimiento.monto;
    });
    
    // Generar HTML
    const html = Object.entries(totalesPorCategoria).map(([categoria, totales]) => {
        const neto = totales.ingreso - totales.egreso;
        return `
            <div class="categoria-chip ${neto >= 0 ? 'ingreso-chip' : 'egreso-chip'}">
                <strong>${categoria}</strong><br>
                <small>${formatearMoneda(neto)}</small>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html || '<div class="text-muted">No hay categorías con movimientos</div>';
}

// Funciones de reportes
function actualizarReportes() {
    const movimientosFiltrados = filtrarMovimientos();
    actualizarGraficos(movimientosFiltrados);
    actualizarResumenReporte(movimientosFiltrados);
    actualizarListaReportes(movimientosFiltrados);
}

function filtrarMovimientos() {
    const periodo = document.getElementById('filtro-periodo')?.value || 'todos';
    const anio = document.getElementById('filtro-anio')?.value || 'todos';
    const mes = document.getElementById('filtro-mes')?.value || 'todos';
    const tipo = document.getElementById('filtro-tipo')?.value || 'todos';
    const categoria = document.getElementById('filtro-categoria')?.value || 'todas';
    
    return movimientos.filter(movimiento => {
        const fechaMovimiento = new Date(movimiento.fecha);
        const ahora = new Date();
        
        // Filtro por período
        if (periodo !== 'todos') {
            switch (periodo) {
                case 'semana':
                    const inicioSemana = new Date(ahora);
                    inicioSemana.setDate(ahora.getDate() - 7);
                    if (fechaMovimiento < inicioSemana) return false;
                    break;
                case 'mes':
                    if (fechaMovimiento.getMonth() !== ahora.getMonth() || 
                        fechaMovimiento.getFullYear() !== ahora.getFullYear()) return false;
                    break;
                case 'anio':
                    if (fechaMovimiento.getFullYear() !== ahora.getFullYear()) return false;
                    break;
            }
        }
        
        // Filtro por año
        if (anio !== 'todos' && fechaMovimiento.getFullYear() !== parseInt(anio)) {
            return false;
        }
        
        // Filtro por mes
        if (mes !== 'todos' && (fechaMovimiento.getMonth() + 1) !== parseInt(mes)) {
            return false;
        }
        
        // Filtro por tipo
        if (tipo !== 'todos' && movimiento.tipo !== tipo) {
            return false;
        }
        
        // Filtro por categoría
        if (categoria !== 'todas') {
            const cat = CATEGORIAS.find(c => c.id === movimiento.categoria);
            const nombreCategoria = cat ? cat.nombre : movimiento.categoria;
            if (nombreCategoria !== categoria) return false;
        }
        
        return true;
    });
}

function actualizarGraficos(movimientosFiltrados) {
    actualizarGraficoComparacion(movimientosFiltrados);
    actualizarGraficoCategorias(movimientosFiltrados);
    actualizarGraficoEvolucion(movimientosFiltrados);
}

function actualizarGraficoComparacion(movimientos) {
    const ctx = document.getElementById('graficoComparacion');
    if (!ctx) return;
    
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    
    if (graficoComparacion) {
        graficoComparacion.destroy();
    }
    
    graficoComparacion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ingresos', 'Egresos'],
            datasets: [{
                data: [ingresos, egresos],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos vs Egresos'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function actualizarGraficoCategorias(movimientos) {
    const ctx = document.getElementById('graficoCategorias');
    if (!ctx) return;
    
    const categorias = {};
    movimientos.forEach(m => {
        const cat = CATEGORIAS.find(c => c.id === m.categoria);
        const nombre = cat ? cat.nombre : m.categoria;
        categorias[nombre] = (categorias[nombre] || 0) + m.monto;
    });
    
    if (graficoCategorias) {
        graficoCategorias.destroy();
    }
    
    graficoCategorias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                label: 'Monto',
                data: Object.values(categorias),
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gastos por Categoría'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function actualizarGraficoEvolucion(movimientos) {
    const ctx = document.getElementById('graficoEvolucion');
    if (!ctx) return;
    
    // Agrupar por mes
    const meses = {};
    movimientos.forEach(m => {
        const fecha = new Date(m.fecha);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        if (!meses[key]) {
            meses[key] = { ingresos: 0, egresos: 0 };
        }
        
        meses[key][m.tipo === 'ingreso' ? 'ingresos' : 'egresos'] += m.monto;
    });
    
    const labels = Object.keys(meses).sort();
    const ingresos = labels.map(label => meses[label].ingresos);
    const egresos = labels.map(label => meses[label].egresos);
    
    if (graficoEvolucion) {
        graficoEvolucion.destroy();
    }
    
    graficoEvolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(label => {
                const [year, month] = label.split('-');
                return `${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true
                },
                {
                    label: 'Egresos',
                    data: egresos,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución Mensual'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function actualizarResumenReporte(movimientos) {
    const container = document.getElementById('resumen-reporte');
    if (!container) return;
    
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    const balance = ingresos - egresos;
    
    container.innerHTML = `
        <div class="row text-center">
            <div class="col-md-3">
                <h5 class="text-success">${formatearMoneda(ingresos)}</h5>
                <small class="text-muted">Total Ingresos</small>
            </div>
            <div class="col-md-3">
                <h5 class="text-danger">${formatearMoneda(egresos)}</h5>
                <small class="text-muted">Total Egresos</small>
            </div>
            <div class="col-md-3">
                <h5 class="${balance >= 0 ? 'text-success' : 'text-danger'}">${formatearMoneda(balance)}</h5>
                <small class="text-muted">Balance</small>
            </div>
            <div class="col-md-3">
                <h5 class="text-info">${movimientos.length}</h5>
                <small class="text-muted">Movimientos</small>
            </div>
        </div>
    `;
}

function actualizarListaReportes(movimientos) {
    const container = document.getElementById('lista-reportes');
    if (!container) return;
    
    if (movimientos.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay movimientos que cumplan con los filtros seleccionados.</div>';
        return;
    }
    
    const html = movimientos.map(movimiento => {
        const categoria = CATEGORIAS.find(c => c.id === movimiento.categoria);
        const nombreCategoria = categoria ? categoria.nombre : movimiento.categoria;
        
        return `
            <div class="list-group-item ${movimiento.tipo}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${nombreCategoria}</h6>
                        <p class="mb-1">${movimiento.descripcion || 'Sin descripción'}</p>
                        <small class="text-muted">${formatearFecha(movimiento.fecha)}</small>
                    </div>
                    <div class="text-end">
                        <h6 class="mb-1 ${movimiento.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                            ${movimiento.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(movimiento.monto)}
                        </h6>
                        <button class="btn btn-sm btn-outline-primary editar-btn" onclick="abrirEdicion(${movimiento.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="list-group">${html}</div>`;
}

// Funciones de exportación/importación
function exportarAExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            mostrarAlerta('Error: Biblioteca XLSX no disponible', 'danger');
            return;
        }
        
        const datos = movimientos.map(m => {
            const categoria = CATEGORIAS.find(c => c.id === m.categoria);
            return {
                'Fecha': formatearFecha(m.fecha),
                'Tipo': m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
                'Categoría': categoria ? categoria.nombre : m.categoria,
                'Descripción': m.descripcion || '',
                'Monto': m.monto
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
        
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `finanzas_${fecha}.xlsx`);
        
        mostrarAlerta('Datos exportados correctamente', 'success');
    } catch (error) {
        mostrarAlerta('Error al exportar los datos', 'danger');
        console.error(error);
    }
}

function exportarAJSON() {
    try {
        const datos = {
            exportado: new Date().toISOString(),
            movimientos: movimientos
        };
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        mostrarAlerta('Datos exportados correctamente', 'success');
    } catch (error) {
        mostrarAlerta('Error al exportar los datos', 'danger');
        console.error(error);
    }
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let datosImportados;
            
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                datosImportados = JSON.parse(e.target.result);
                if (datosImportados.movimientos) {
                    datosImportados = datosImportados.movimientos;
                }
            } else {
                mostrarAlerta('Formato de archivo no soportado', 'danger');
                return;
            }
            
            // Validar y limpiar datos
            const movimientosValidos = datosImportados.filter(m => 
                m.id && m.fecha && m.tipo && m.categoria && typeof m.monto === 'number'
            ).map(m => ({
                ...m,
                fecha: validarFecha(m.fecha)
            }));
            
            if (movimientosValidos.length === 0) {
                mostrarAlerta('No se encontraron movimientos válidos en el archivo', 'warning');
                return;
            }
            
            if (confirm(`¿Desea importar ${movimientosValidos.length} movimientos? Esto reemplazará todos los datos actuales.`)) {
                movimientos = movimientosValidos;
                guardarDatos();
                actualizarUI();
                mostrarAlerta(`Se importaron ${movimientosValidos.length} movimientos correctamente`, 'success');
            }
            
        } catch (error) {
            mostrarAlerta('Error al procesar el archivo', 'danger');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpiar input
}

// Funciones para administrar categorías
function agregarCategoria() {
    try {
        const form = document.getElementById('form-categoria');
        if (!form) {
            throw new Error('Formulario no encontrado');
        }
        
        const formData = new FormData(form);
        const nombre = formData.get('nombre').trim();
        const tipo = formData.get('tipo-categoria');
        
        // Validaciones
        if (!nombre) {
            throw new Error('El nombre de la categoría es obligatorio');
        }
        
        if (nombre.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        // Verificar si ya existe una categoría con el mismo nombre y tipo
        const categoriaExistente = CATEGORIAS.find(c => 
            c.nombre.toLowerCase() === nombre.toLowerCase() && c.tipo === tipo
        );
        
        if (categoriaExistente) {
            throw new Error('Ya existe una categoría con ese nombre para este tipo');
        }
        
        // Crear ID único
        const id = nombre.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '') + 
            (tipo === 'egreso' ? '-egreso' : '') + 
            '-' + Date.now();
        
        // Crear nueva categoría
        const nuevaCategoria = {
            id: id,
            nombre: nombre,
            tipo: tipo
        };
        
        // Agregar a la lista
        CATEGORIAS.push(nuevaCategoria);
        guardarCategorias();
        
        // Actualizar UI
        mostrarCategorias();
        cargarCategorias();
        inicializarFiltroCategorias();
        
        // Limpiar formulario
        form.reset();
        document.getElementById('ingreso-categoria').checked = true;
        
        mostrarAlerta('Categoría agregada correctamente', 'success');
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        console.error(error);
    }
}

function eliminarCategoria(id) {
    try {
        // Verificar si la categoría está siendo usada
        const categoriaEnUso = movimientos.some(m => m.categoria === id);
        
        if (categoriaEnUso) {
            mostrarAlerta('No se puede eliminar una categoría que está siendo utilizada en movimientos', 'warning');
            return;
        }
        
        // Encontrar la categoría
        const categoria = CATEGORIAS.find(c => c.id === id);
        if (!categoria) {
            throw new Error('Categoría no encontrada');
        }
        
        // Confirmar eliminación
        if (!confirm(`¿Está seguro de que desea eliminar la categoría "${categoria.nombre}"?`)) {
            return;
        }
        
        // Eliminar de la lista
        CATEGORIAS = CATEGORIAS.filter(c => c.id !== id);
        guardarCategorias();
        
        // Actualizar UI
        mostrarCategorias();
        cargarCategorias();
        inicializarFiltroCategorias();
        
        mostrarAlerta('Categoría eliminada correctamente', 'success');
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        console.error(error);
    }
}

function mostrarCategorias() {
    const container = document.getElementById('lista-categorias');
    if (!container) return;
    
    const filtroTipo = document.getElementById('filtro-tipo-categoria')?.value || 'todas';
    
    // Filtrar categorías
    let categoriasFiltradas = CATEGORIAS;
    if (filtroTipo !== 'todas') {
        categoriasFiltradas = CATEGORIAS.filter(c => c.tipo === filtroTipo);
    }
    
    // Ordenar por nombre
    categoriasFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    if (categoriasFiltradas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay categorías para mostrar</p>';
        return;
    }
    
    container.innerHTML = categoriasFiltradas.map(categoria => {
        // Verificar si está en uso
        const enUso = movimientos.some(m => m.categoria === categoria.id);
        
        return `
            <div class="categoria-item ${categoria.tipo}">
                <div class="categoria-nombre">${categoria.nombre}</div>
                <div class="d-flex align-items-center">
                    <span class="categoria-tipo ${categoria.tipo}">
                        ${categoria.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                    ${enUso ? 
                        '<small class="text-muted me-2">En uso</small>' : 
                        `<button class="btn btn-outline-danger btn-sm btn-eliminar-categoria" 
                                onclick="eliminarCategoria('${categoria.id}')" 
                                title="Eliminar categoría">
                            <i class="bi bi-trash"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Funciones de búsqueda avanzada
function inicializarBusquedaAvanzada() {
    // Cargar categorías en el select de búsqueda
    cargarCategoriasBusqueda();
    
    // Event listeners para búsqueda
    const ejecutarBtn = document.getElementById('ejecutar-busqueda');
    const limpiarBtn = document.getElementById('limpiar-busqueda');
    const buscarDescripcion = document.getElementById('buscar-descripcion');
    
    if (ejecutarBtn) {
        ejecutarBtn.addEventListener('click', ejecutarBusquedaAvanzada);
    }
    
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarBusquedaAvanzada);
    }
    
    // Búsqueda en tiempo real mientras escribes
    if (buscarDescripcion) {
        buscarDescripcion.addEventListener('input', debounce(ejecutarBusquedaAvanzada, 300));
    }
}

function cargarCategoriasBusqueda() {
    const select = document.getElementById('buscar-categoria');
    if (!select) return;
    
    // Limpiar opciones existentes excepto la primera
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Agregar categorías
    CATEGORIAS.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        select.appendChild(option);
    });
}

function ejecutarBusquedaAvanzada() {
    const descripcion = document.getElementById('buscar-descripcion')?.value.toLowerCase().trim() || '';
    const montoMin = parseFloat(document.getElementById('buscar-monto-min')?.value) || 0;
    const montoMax = parseFloat(document.getElementById('buscar-monto-max')?.value) || Infinity;
    const fechaDesde = document.getElementById('buscar-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('buscar-fecha-hasta')?.value || '';
    const tipo = document.getElementById('buscar-tipo')?.value || 'todos';
    const categoria = document.getElementById('buscar-categoria')?.value || 'todas';
    
    // Filtrar movimientos según criterios
    let resultados = movimientos.filter(mov => {
        // Filtro por descripción
        if (descripcion && !mov.descripcion.toLowerCase().includes(descripcion)) {
            return false;
        }
        
        // Filtro por monto
        const monto = Math.abs(mov.monto);
        if (monto < montoMin || monto > montoMax) {
            return false;
        }
        
        // Filtro por fecha
        const fechaMov = new Date(mov.fecha);
        if (fechaDesde && fechaMov < new Date(fechaDesde)) {
            return false;
        }
        if (fechaHasta && fechaMov > new Date(fechaHasta + ' 23:59:59')) {
            return false;
        }
        
        // Filtro por tipo
        if (tipo !== 'todos' && mov.tipo !== tipo) {
            return false;
        }
        
        // Filtro por categoría
        if (categoria !== 'todas' && mov.categoria !== categoria) {
            return false;
        }
        
        return true;
    });
    
    // Ordenar por fecha más reciente primero
    resultados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    mostrarResultadosBusqueda(resultados);
}

function mostrarResultadosBusqueda(resultados) {
    const contenedorResultados = document.getElementById('resultados-busqueda');
    const contadorResultados = document.getElementById('contador-resultados');
    const listaResultados = document.getElementById('lista-resultados');
    
    if (!contenedorResultados || !contadorResultados || !listaResultados) return;
    
    // Mostrar/ocultar sección de resultados
    if (resultados.length > 0) {
        contenedorResultados.style.display = 'block';
        contadorResultados.textContent = `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`;
        
        // Limpiar lista anterior
        listaResultados.innerHTML = '';
        
        // Mostrar resultados
        resultados.forEach(mov => {
            const item = document.createElement('div');
            item.className = `list-group-item ${mov.tipo}`;
            
            const categoria = CATEGORIAS.find(c => c.id === mov.categoria);
            const nombreCategoria = categoria ? categoria.nombre : mov.categoria;
            
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="mb-0">${mov.descripcion}</h6>
                            <span class="fw-bold ${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                                ${mov.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(Math.abs(mov.monto))}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-calendar"></i> ${formatearFecha(mov.fecha)}
                            </small>
                            <span class="categoria-chip ${mov.tipo}-chip">${nombreCategoria}</span>
                        </div>
                    </div>
                    <div class="ms-2">
                        <button class="btn btn-sm btn-outline-primary editar-btn" onclick="abrirEdicion('${mov.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </div>
            `;
            
            listaResultados.appendChild(item);
        });
        
        // Scroll hacia los resultados
        contenedorResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Verificar si hay criterios de búsqueda activos
        const hayBusqueda = document.getElementById('buscar-descripcion')?.value ||
                           document.getElementById('buscar-monto-min')?.value ||
                           document.getElementById('buscar-monto-max')?.value ||
                           document.getElementById('buscar-fecha-desde')?.value ||
                           document.getElementById('buscar-fecha-hasta')?.value ||
                           document.getElementById('buscar-tipo')?.value !== 'todos' ||
                           document.getElementById('buscar-categoria')?.value !== 'todas';
        
        if (hayBusqueda) {
            contenedorResultados.style.display = 'block';
            contadorResultados.textContent = '0 resultados';
            listaResultados.innerHTML = '<div class="text-center text-muted py-3">No se encontraron movimientos que coincidan con los criterios de búsqueda.</div>';
        } else {
            contenedorResultados.style.display = 'none';
        }
    }
}

function limpiarBusquedaAvanzada() {
    // Limpiar todos los campos de búsqueda
    document.getElementById('buscar-descripcion').value = '';
    document.getElementById('buscar-monto-min').value = '';
    document.getElementById('buscar-monto-max').value = '';
    document.getElementById('buscar-fecha-desde').value = '';
    document.getElementById('buscar-fecha-hasta').value = '';
    document.getElementById('buscar-tipo').value = 'todos';
    document.getElementById('buscar-categoria').value = 'todas';
    
    // Ocultar resultados
    const contenedorResultados = document.getElementById('resultados-busqueda');
    if (contenedorResultados) {
        contenedorResultados.style.display = 'none';
    }
}

// Función debounce para evitar demasiadas búsquedas mientras se escribe
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', inicializarApp);
