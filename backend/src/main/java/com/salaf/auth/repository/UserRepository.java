package com.salaf.auth.repository;

import com.salaf.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE :pattern OR u.phone LIKE :pattern")
    List<User> searchByEmailOrName(@Param("pattern") String pattern);
}
