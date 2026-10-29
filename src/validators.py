from decimal import Decimal, InvalidOperation

def validar_calificacion(valor):
    # TODO: rechazar valores nulos, booleanos, texto no numérico, NaN, Infinity, fuera de 0..100 y >2 decimales.
    # No redondear entradas incorrectas.
    
    # Definir str_val antes de usarlo
    str_val = str(valor).strip()

    try:
        numero = Decimal(str(valor))
    except InvalidOperation:
        raise ValueError("La calificación debe ser un número válido.")

    # Validación para capturar NaN e Infinito antes de comparar números
    if numero.is_nan() or numero.is_infinite():
        raise ValueError("La calificación no puede ser NaN ni Infinito.")    
    
    if numero < 0 or numero > 100:
        raise ValueError("La calificación debe estar entre 0 y 100.")

    # Validación para rechazar más de 2 decimales
    if "." in str_val and len(str_val.split(".")[1]) > 2:
        raise ValueError("La calificación no puede tener más de 2 decimales.")
    
    return numero