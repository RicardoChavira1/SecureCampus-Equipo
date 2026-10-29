from decimal import Decimal, InvalidOperation

def validar_calificacion(valor):
    # 1. Rechazar nulos y booleanos explícitamente
    if valor is None or isinstance(valor, bool):
        raise ValueError("El valor no puede ser nulo ni booleano.")

    # 2. Convertir a string limpio y verificar que no esté vacío
    str_val = str(valor).strip()
    if not str_val:
        raise ValueError("La calificación no puede estar vacía.")

    # 3. Intentar conversión estricta a Decimal
    try:
        numero = Decimal(str_val)
    except (InvalidOperation, TypeError):
        raise ValueError("La calificación debe ser un número válido.")

    # 4. Rechazar NaN e Infinito
    if numero.is_nan() or numero.is_infinite():
        raise ValueError("La calificación no puede ser NaN ni Infinito.")

    # 5. Validar rango de 0 a 100
    if numero < Decimal("0") or numero > Decimal("100"):
        raise ValueError("La calificación debe estar entre 0 y 100.")

    # 6. Validar máximo de 2 decimales sin redondear
    if "." in str_val:
        parte_decimal = str_val.split(".")[1]
        if len(parte_decimal) > 2:
            raise ValueError("La calificación no puede tener más de 2 decimales.")

    return numero