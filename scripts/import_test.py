import importlib, traceback, sys, os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
try:
    m = importlib.import_module('app.crud.crud_dashboard')
    print('OK: get_dashboard_data exists=', hasattr(m, 'get_dashboard_data'))
except Exception:
    traceback.print_exc()
