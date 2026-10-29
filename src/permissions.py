def puede_modificar(user, student_id, group_id, con):
    if not user or user['role'] != 'profesor':
        return False

    # La columna correcta en la base de datos es professor_id
    grupo = con.execute(
        "SELECT 1 FROM groups WHERE id = ? AND professor_id = ?",
        (group_id, user['id'])
    ).fetchone()
    if not grupo:
        return False

    # Verificar que el estudiante esté inscrito en dicho grupo
    inscripcion = con.execute(
        "SELECT 1 FROM enrollments WHERE student_id = ? AND group_id = ?",
        (student_id, group_id)
    ).fetchone()
    return inscripcion is not None


def puede_consultar(user, student_id, group_id, con):
    if not user:
        return False

    role = user['role']

    # Administradores no consultan notas por defecto
    if role == 'admin':
        return False

    # El estudiante solo puede consultar su propia nota en el grupo inscrito
    if role == 'estudiante':
        if user['id'] != student_id:
            return False
        inscripcion = con.execute(
            "SELECT 1 FROM enrollments WHERE student_id = ? AND group_id = ?",
            (student_id, group_id)
        ).fetchone()
        return inscripcion is not None

    # El profesor consulta si es titular del grupo con el alumno inscrito
    if role == 'profesor':
        return puede_modificar(user, student_id, group_id, con)

    return False